const header = document.querySelector("[data-header]");
const form = document.querySelector(".contact-form");
const formNote = document.querySelector("[data-form-note]");
const canvas = document.querySelector("#threat-canvas");
const cursorGlow = document.querySelector("[data-cursor-glow]");
const magneticElements = document.querySelectorAll(".magnetic");

// ── Google Sheets Integration ────────────────────────────────────
// Replace this URL with your deployed Google Apps Script Web App URL.
// See Code.gs in this project for setup instructions.
const GOOGLE_SCRIPT_URL = "YOUR_GOOGLE_SCRIPT_URL_HERE";

/**
 * Submits form data to Google Sheets via the Apps Script webhook.
 * Uses 'no-cors' mode so no CORS preflight is needed from a static site.
 * @param {Object} payload - Form data including formType field
 * @returns {Promise<boolean>} - true on success
 */
async function submitToGoogleSheets(payload) {
  if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL === "YOUR_GOOGLE_SCRIPT_URL_HERE") {
    console.warn("[KavachIQ] Google Script URL not configured. Skipping Sheets submission.");
    return true; // Treat as success so UX still works
  }
  payload.timestamp = new Date().toISOString();
  payload.source = "website";
  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors", // Required for static site → Apps Script
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    return true;
  } catch (err) {
    console.error("[KavachIQ] Sheets submission error:", err);
    return false;
  }
}
const ctx = canvas.getContext("2d");

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let width = 0;
let height = 0;
let nodes = [];
let attackPackets = [];
let impactPulses = [];
let animationFrame = 0;

// Visual effect variables
let shieldRotation = 0;
let radarAngle = 0;
let gridOffsetX = 0;
let gridOffsetY = 0;
let mouse = { x: null, y: null, active: false };
let mouseParticles = [];

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function resizeCanvas() {
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  width = canvas.offsetWidth;
  height = canvas.offsetHeight;
  canvas.width = Math.floor(width * pixelRatio);
  canvas.height = Math.floor(height * pixelRatio);
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

  const nodeCount = Math.max(34, Math.floor((width * height) / 26000));
  nodes = Array.from({ length: nodeCount }, (_, index) => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.28,
    vy: (Math.random() - 0.5) * 0.28,
    radius: index % 7 === 0 ? 2.8 : 1.7,
    hot: index % 6 === 0
  }));

  const core = { x: width * 0.73, y: height * 0.45 };
  const edgeNodes = nodes.filter((node) => node.x < width * 0.55);
  attackPackets = Array.from({ length: Math.max(7, Math.floor(nodes.length / 5)) }, () => {
    const source = randomItem(edgeNodes.length ? edgeNodes : nodes);
    return {
      source,
      target: {
        x: core.x + (Math.random() - 0.5) * 110,
        y: core.y + (Math.random() - 0.5) * 130
      },
      progress: Math.random(),
      speed: 0.003 + Math.random() * 0.006,
      blockedAt: 0.78 + Math.random() * 0.16
    };
  });
}

function drawThreatMap() {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#050708";
  ctx.fillRect(0, 0, width, height);

  const core = {
    x: width * 0.73,
    y: height * 0.45,
    radius: Math.max(56, Math.min(width, height) * 0.1)
  };

  // 1. FLOATING GRID WITH DRIFT AND PARALLAX
  if (!prefersReducedMotion) {
    gridOffsetX = (gridOffsetX + 0.12) % 48;
    gridOffsetY = (gridOffsetY + 0.08) % 48;
  }
  const gridSpacing = 48;
  const px = mouse.active && mouse.x !== null ? (mouse.x - width / 2) * -0.03 : 0;
  const py = mouse.active && mouse.y !== null ? (mouse.y - height / 2) * -0.03 : 0;
  ctx.strokeStyle = "rgba(32, 231, 255, 0.03)";
  ctx.lineWidth = 1;
  
  for (let x = ((gridOffsetX + px) % gridSpacing) - gridSpacing; x < width + gridSpacing; x += gridSpacing) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = ((gridOffsetY + py) % gridSpacing) - gridSpacing; y < height + gridSpacing; y += gridSpacing) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  // Grid intersection dots
  ctx.fillStyle = "rgba(57, 255, 136, 0.08)";
  for (let x = ((gridOffsetX + px) % gridSpacing) - gridSpacing; x < width + gridSpacing; x += gridSpacing) {
    for (let y = ((gridOffsetY + py) % gridSpacing) - gridSpacing; y < height + gridSpacing; y += gridSpacing) {
      ctx.fillRect(x - 1, y - 1, 2, 2);
    }
  }

  // 2. RADAR SWEEP CONE
  if (!prefersReducedMotion) {
    radarAngle = (radarAngle + 0.005) % (Math.PI * 2);
  }
  ctx.save();
  ctx.translate(core.x, core.y);
  ctx.rotate(radarAngle);
  const sweepLength = Math.max(width, height) * 0.9;
  const sweepSteps = 50;
  for (let i = 0; i < sweepSteps; i++) {
    const angle = -i * (Math.PI / 180) * 0.7; // fade backwards
    const alpha = (1 - i / sweepSteps) * 0.16;
    ctx.strokeStyle = `rgba(32, 231, 255, ${alpha})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(angle) * sweepLength, Math.sin(angle) * sweepLength);
    ctx.stroke();
  }
  ctx.restore();

  // Core Shield radial gradient background
  const shieldGlow = ctx.createRadialGradient(core.x, core.y, 0, core.x, core.y, core.radius * 2.4);
  shieldGlow.addColorStop(0, "rgba(57, 255, 136, 0.16)");
  shieldGlow.addColorStop(0.42, "rgba(32, 231, 255, 0.08)");
  shieldGlow.addColorStop(1, "rgba(5, 7, 8, 0)");
  ctx.fillStyle = shieldGlow;
  ctx.beginPath();
  ctx.arc(core.x, core.y, core.radius * 2.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(32, 231, 255, 0.22)";
  ctx.lineWidth = 1;
  for (let ring = 1; ring <= 3; ring += 1) {
    ctx.beginPath();
    ctx.arc(core.x, core.y, core.radius * (0.7 + ring * 0.35), 0, Math.PI * 2);
    ctx.stroke();
  }

  // 3. NODES MIGRATION WITH MOUSE REPULSION
  for (let i = 0; i < nodes.length; i += 1) {
    const node = nodes[i];

    if (!prefersReducedMotion) {
      node.x += node.vx;
      node.y += node.vy;

      // Mouse repulsion
      if (mouse.active && mouse.x !== null) {
        const dx = node.x - mouse.x;
        const dy = node.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 130) {
          const force = (130 - dist) / 130;
          const repelPower = 1.6;
          node.x += (dx / dist) * force * repelPower;
          node.y += (dy / dist) * force * repelPower;
        }
      }

      if (node.x < -20) node.x = width + 20;
      if (node.x > width + 20) node.x = -20;
      if (node.y < -20) node.y = height + 20;
      if (node.y > height + 20) node.y = -20;
    }

    for (let j = i + 1; j < nodes.length; j += 1) {
      const other = nodes[j];
      const dx = node.x - other.x;
      const dy = node.y - other.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 155) {
        const alpha = (1 - distance / 155) * 0.24;
        ctx.strokeStyle = node.hot || other.hot
          ? `rgba(57, 255, 136, ${alpha})`
          : `rgba(32, 231, 255, ${alpha})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(node.x, node.y);
        ctx.lineTo(other.x, other.y);
        ctx.stroke();
      }
    }
  }

  // 4. ATTACK PACKETS
  attackPackets.forEach((packet) => {
    const blocked = packet.progress >= packet.blockedAt;
    const progress = blocked ? packet.blockedAt : packet.progress;
    const x = packet.source.x + (packet.target.x - packet.source.x) * progress;
    const y = packet.source.y + (packet.target.y - packet.source.y) * progress;
    const trailProgress = Math.max(0, progress - 0.08);
    const trailX = packet.source.x + (packet.target.x - packet.source.x) * trailProgress;
    const trailY = packet.source.y + (packet.target.y - packet.source.y) * trailProgress;

    ctx.strokeStyle = blocked ? "rgba(57, 255, 136, 0.36)" : "rgba(32, 231, 255, 0.42)";
    ctx.lineWidth = blocked ? 2 : 1.4;
    ctx.beginPath();
    ctx.moveTo(trailX, trailY);
    ctx.lineTo(x, y);
    ctx.stroke();

    ctx.fillStyle = blocked ? "#39ff88" : "#20e7ff";
    ctx.beginPath();
    ctx.arc(x, y, blocked ? 3.8 : 2.8, 0, Math.PI * 2);
    ctx.fill();

    if (!prefersReducedMotion) {
      packet.progress += packet.speed;

      if (packet.progress >= packet.blockedAt && !packet.wasBlocked) {
        packet.wasBlocked = true;
        impactPulses.push({ x, y, radius: 8, alpha: 0.55 });
      }

      if (packet.progress >= 1.06) {
        const edgeNodes = nodes.filter((node) => node.x < width * 0.55);
        packet.source = randomItem(edgeNodes.length ? edgeNodes : nodes);
        packet.target = {
          x: core.x + (Math.random() - 0.5) * 110,
          y: core.y + (Math.random() - 0.5) * 130
        };
        packet.progress = 0;
        packet.speed = 0.003 + Math.random() * 0.006;
        packet.blockedAt = 0.78 + Math.random() * 0.16;
        packet.wasBlocked = false;
      }
    }
  });

  impactPulses = impactPulses.filter((pulse) => pulse.alpha > 0.03);
  impactPulses.forEach((pulse) => {
    ctx.strokeStyle = `rgba(57, 255, 136, ${pulse.alpha})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(pulse.x, pulse.y, pulse.radius, 0, Math.PI * 2);
    ctx.stroke();

    if (!prefersReducedMotion) {
      pulse.radius += 1.4;
      pulse.alpha *= 0.94;
    }
  });

  // 5. ROTATING HEXAGONAL SHIELDS (Double concentric)
  if (!prefersReducedMotion) {
    shieldRotation += 0.0035;
  }
  // Outer Shield (Clockwise)
  ctx.save();
  ctx.translate(core.x, core.y);
  ctx.rotate(shieldRotation);
  ctx.strokeStyle = "rgba(57, 255, 136, 0.74)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let side = 0; side < 6; side += 1) {
    const angle = side * (Math.PI / 3);
    const x = Math.cos(angle) * core.radius;
    const y = Math.sin(angle) * core.radius;
    if (side === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.restore();

  // Inner Shield (Counter-Clockwise)
  ctx.save();
  ctx.translate(core.x, core.y);
  ctx.rotate(-shieldRotation * 1.5);
  ctx.strokeStyle = "rgba(32, 231, 255, 0.55)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let side = 0; side < 6; side += 1) {
    const angle = side * (Math.PI / 3) + Math.PI / 6;
    const x = Math.cos(angle) * (core.radius * 0.7);
    const y = Math.sin(angle) * (core.radius * 0.7);
    if (side === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();
  
  // Center Tick
  ctx.strokeStyle = "rgba(32, 231, 255, 0.8)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-core.radius * 0.22, -core.radius * 0.02);
  ctx.lineTo(-core.radius * 0.05, core.radius * 0.16);
  ctx.lineTo(core.radius * 0.25, -core.radius * 0.18);
  ctx.stroke();
  ctx.restore();

  // 6. DRAW AND GLOW NODES (With Radar Sweep highlight)
  nodes.forEach((node) => {
    const dx = node.x - core.x;
    const dy = node.y - core.y;
    const nodeAngle = Math.atan2(dy, dx);
    let normRadar = radarAngle % (Math.PI * 2);
    if (normRadar < 0) normRadar += Math.PI * 2;
    let normNode = nodeAngle % (Math.PI * 2);
    if (normNode < 0) normNode += Math.PI * 2;
    
    let diff = normRadar - normNode;
    diff = (diff + Math.PI * 2) % (Math.PI * 2);
    
    let sweepBoost = 0;
    if (diff < 0.45) {
      sweepBoost = (1 - diff / 0.45);
    }

    const baseRadius = node.hot ? 28 : 20;
    const finalGlowRadius = baseRadius * (1 + sweepBoost * 0.5);
    const glow = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, finalGlowRadius);
    const baseGlowAlpha = node.hot ? 0.55 : 0.48;
    const glowAlpha = baseGlowAlpha + sweepBoost * 0.35;
    glow.addColorStop(0, node.hot 
      ? `rgba(57, 255, 136, ${glowAlpha})` 
      : `rgba(32, 231, 255, ${glowAlpha})`
    );
    glow.addColorStop(1, "rgba(5, 7, 8, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(node.x, node.y, finalGlowRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = node.hot ? "#39ff88" : "#20e7ff";
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.radius * (1 + sweepBoost * 0.7), 0, Math.PI * 2);
    ctx.fill();
  });

  // 7. DRAW AND ANIME INTERACTIVE MOUSE PARTICLES
  if (!prefersReducedMotion) {
    mouseParticles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;
      p.radius *= 0.97;
      
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    mouseParticles = mouseParticles.filter(p => p.alpha > 0.05);
  }

  if (!prefersReducedMotion) {
    animationFrame = requestAnimationFrame(drawThreatMap);
  }
}

function handleHeaderState() {
  header.classList.toggle("is-scrolled", window.scrollY > 12);
}

async function handleFormSubmit(event) {
  event.preventDefault();
  const submitBtn = form.querySelector("button[type='submit']");
  const originalBtnText = submitBtn ? submitBtn.textContent : null;

  // Show loading state
  if (submitBtn) {
    submitBtn.textContent = "Sending...";
    submitBtn.disabled = true;
    submitBtn.style.opacity = "0.7";
  }
  if (formNote) {
    formNote.textContent = "Submitting your request...";
    formNote.style.color = "var(--cyan)";
  }

  // Collect form data
  const data = Object.fromEntries(new FormData(form));
  const payload = {
    formType: "contact",
    name:     data["name"]    || "",
    email:    data["email"]   || "",
    service:  data["service"] || "",
    message:  data["message"] || ""
  };

  const ok = await submitToGoogleSheets(payload);

  // Restore button
  if (submitBtn) {
    submitBtn.textContent = originalBtnText;
    submitBtn.disabled = false;
    submitBtn.style.opacity = "";
  }

  if (ok) {
    form.reset();
    if (formNote) {
      formNote.textContent = "✓ Request received! We will get back to you within one business day.";
      formNote.style.color = "var(--green)";
    }
  } else {
    if (formNote) {
      formNote.textContent = "⚠ Submission failed. Please try again or contact us via WhatsApp.";
      formNote.style.color = "#ff6b6b";
    }
  }
}

function handlePointerMove(event) {
  document.body.classList.add("has-pointer");
  cursorGlow.style.left = `${event.clientX}px`;
  cursorGlow.style.top = `${event.clientY}px`;
}

function updateMagneticGlow(event) {
  const rect = event.currentTarget.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  event.currentTarget.style.setProperty("--mx", `${x}px`);
  event.currentTarget.style.setProperty("--my", `${y}px`);
}

function handleCanvasPointerMove(event) {
  const rect = canvas.getBoundingClientRect();
  mouse.x = event.clientX - rect.left;
  mouse.y = event.clientY - rect.top;
  mouse.active = true;

  if (!prefersReducedMotion) {
    for (let i = 0; i < 2; i++) {
      mouseParticles.push({
        x: mouse.x,
        y: mouse.y,
        vx: (Math.random() - 0.5) * 1.8,
        vy: (Math.random() - 0.5) * 1.8,
        radius: Math.random() * 2.5 + 1.2,
        color: Math.random() > 0.45 ? "rgba(32, 231, 255, 0.85)" : "rgba(57, 255, 136, 0.85)",
        alpha: 1,
        decay: 0.02 + Math.random() * 0.015
      });
    }
  }
}

function handleCanvasPointerLeave() {
  mouse.active = false;
  mouse.x = null;
  mouse.y = null;
}

const hero = document.querySelector(".hero");
const heroContent = document.querySelector(".hero-content");
const threatCanvas = document.querySelector("#threat-canvas");
const codeRain = document.querySelector(".code-rain");

function handleHeroParallax(event) {
  if (prefersReducedMotion || !hero || !heroContent || !threatCanvas || !codeRain) return;
  const rect = hero.getBoundingClientRect();
  const x = event.clientX - rect.left - rect.width / 2;
  const y = event.clientY - rect.top - rect.height / 2;

  const pctX = x / (rect.width / 2);
  const pctY = y / (rect.height / 2);

  heroContent.style.transform = `translate3d(${pctX * 16}px, ${pctY * 16}px, 0)`;
  threatCanvas.style.transform = `translate3d(${pctX * -24}px, ${pctY * -24}px, 0) scale(1.06)`;
  codeRain.style.transform = `translate3d(${pctX * -12}px, ${pctY * -12}px, 0)`;
}

function handleHeroParallaxLeave() {
  if (!heroContent || !threatCanvas || !codeRain) return;
  heroContent.style.transform = "translate3d(0, 0, 0)";
  threatCanvas.style.transform = "translate3d(0, 0, 0) scale(1.06)";
  codeRain.style.transform = "translate3d(0, 0, 0)";
}

window.addEventListener("resize", () => {
  cancelAnimationFrame(animationFrame);
  resizeCanvas();
  drawThreatMap();
});

window.addEventListener("scroll", handleHeaderState, { passive: true });
window.addEventListener("pointermove", handlePointerMove, { passive: true });
form.addEventListener("submit", handleFormSubmit);
magneticElements.forEach((element) => {
  element.addEventListener("pointermove", updateMagneticGlow);
});

canvas.addEventListener("pointermove", handleCanvasPointerMove, { passive: true });
canvas.addEventListener("pointerleave", handleCanvasPointerLeave, { passive: true });

if (hero) {
  hero.addEventListener("mousemove", handleHeroParallax, { passive: true });
  hero.addEventListener("mouseleave", handleHeroParallaxLeave, { passive: true });
}

// ── Booking Form → Google Sheets ─────────────────────────────────
const bookingForm = document.querySelector("[data-booking-form]");
const bookingNote = document.querySelector("[data-booking-note]");

if (bookingForm) {
  bookingForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const submitBtn = bookingForm.querySelector("button[type='submit']");
    const originalText = submitBtn ? submitBtn.textContent : null;

    if (submitBtn) { submitBtn.textContent = "Sending..."; submitBtn.disabled = true; submitBtn.style.opacity = "0.7"; }
    if (bookingNote) { bookingNote.textContent = "Submitting booking request..."; bookingNote.style.color = "var(--cyan)"; }

    const data = Object.fromEntries(new FormData(bookingForm));
    const payload = {
      formType:       "booking",
      bookingService: data["booking-service"] || "",
      bookingDate:    data["booking-date"]    || "",
      bookingTime:    data["booking-time"]    || "",
      bookingPhone:   data["booking-phone"]   || ""
    };

    const ok = await submitToGoogleSheets(payload);

    if (submitBtn) { submitBtn.textContent = originalText; submitBtn.disabled = false; submitBtn.style.opacity = ""; }

    if (ok) {
      bookingForm.reset();
      if (bookingNote) {
        bookingNote.textContent = "✓ Booking request submitted! We will confirm your slot within one business day.";
        bookingNote.style.color = "var(--green)";
      }
    } else {
      if (bookingNote) {
        bookingNote.textContent = "⚠ Submission failed. Please try again or contact us via WhatsApp.";
        bookingNote.style.color = "#ff6b6b";
      }
    }
  });
}


const terminalBody = document.querySelector(".terminal-body");
const terminalSequences = [
  { text: "kavachiq@website:~$ scan --target business-site", type: "command" },
  { text: "[INFO] Initializing KavachIQ Security Scan...", type: "info" },
  { text: "[*] Checking SSL/TLS configurations...", type: "info" },
  { text: "[ OK ] SSL Certificate is valid (expires in 244 days)", type: "green" },
  { text: "[*] Port scanning active ports...", type: "info" },
  { text: "[WARN] Port 21 (FTP) is open. Recommendation: Disable FTP", type: "warn" },
  { text: "[*] Scanning core files for malware signatures...", type: "info" },
  { text: "[ OK ] 0 threats detected in /var/www/html", type: "green" },
  { text: "[*] Verifying database integrity...", type: "info" },
  { text: "[ OK ] DB status: Securing credentials...", type: "green" },
  { text: "[SUCCESS] Scan completed. 1 warning found.", type: "green" },
  { text: "kavachiq@website:~$ harden --all-rules", type: "command" },
  { text: "[+] Applying secure HTTP headers...", type: "info" },
  { text: "[+] Disabling directory browsing...", type: "info" },
  { text: "[+] Restricting file uploads size...", type: "info" },
  { text: "[SUCCESS] Hardening complete! Website is secured.", type: "green" }
];

let seqIndex = 0;

function runTerminalSimulation() {
  if (!terminalBody) return;
  terminalBody.innerHTML = "";
  
  function printNextLine() {
    if (seqIndex >= terminalSequences.length) {
      setTimeout(() => {
        seqIndex = 0;
        runTerminalSimulation();
      }, 5000);
      return;
    }
    
    const seq = terminalSequences[seqIndex];
    const p = document.createElement("p");
    
    if (seq.type === "command") {
      p.innerHTML = '<span class="prompt">kavachiq@website</span> ';
      const cmdText = seq.text.substring(21); // Extract command text after prefix
      const span = document.createElement("span");
      p.appendChild(span);
      
      const cursorSpan = document.createElement("span");
      cursorSpan.className = "cursor";
      p.appendChild(cursorSpan);
      
      terminalBody.appendChild(p);
      
      let i = 0;
      function typeChar() {
        if (i < cmdText.length) {
          span.textContent += cmdText[i++];
          setTimeout(typeChar, 50);
        } else {
          cursorSpan.remove(); // Remove active cursor from command
          seqIndex++;
          setTimeout(printNextLine, 600);
        }
      }
      typeChar();
    } else {
      if (seq.type === "green" || seq.type === "success") {
        p.className = "green";
      } else if (seq.type === "warn") {
        p.style.color = "#eefc78"; // Alert yellow
      } else if (seq.type === "info") {
        p.className = "cyan";
      }
      p.textContent = seq.text;
      terminalBody.appendChild(p);
      
      // Auto-scroll
      terminalBody.scrollTop = terminalBody.scrollHeight;
      
      seqIndex++;
      setTimeout(printNextLine, 800 + Math.random() * 500);
    }
  }
  
  printNextLine();
}

// 9. FLOATING FAQ CHATBOT ENGINE
const faqDatabase = [
  {
    keywords: ["free", "health check", "scan", "vulnerability", "report", "check", "intro"],
    answer: "Our **Website Security Health Check** is ₹0 intro (usually ₹499). It includes a basic website vulnerability scan, SSL check, malware risk check, and a 1-page report. You can claim yours by scrolling down to the contact form!"
  },
  {
    keywords: ["website package", "secure website", "package", "harden", "wordpress", "build", "rebuild"],
    answer: "The **KavachIQ Secure Website Package** (₹15,000 – ₹50,000) is built for business websites that need a secure foundation. It covers hardening, SSL configuration, automatic backup setup, and basic SEO readiness."
  },
  {
    keywords: ["protection plan", "protection", "plan", "monthly", "monitoring", "backup management", "support", "care"],
    answer: "The **KavachIQ Protection Plan** (₹2,999 – ₹9,999 / month) delivers ongoing monthly care. It includes 24/7 monitoring, core security updates, backup storage management, active malware defense, and priority support."
  },
  {
    keywords: ["book", "consultation", "booking", "appointment", "schedule", "contact", "phone", "whatsapp", "email", "slot"],
    answer: "You can book a consultation immediately: fill out the **Booking Form** or **Contact Form** on the page. Alternatively, use the WhatsApp button to chat with our security team instantly!"
  },
  {
    keywords: ["kavachiq", "who", "about", "product", "service", "west bengal", "kolkata"],
    answer: "KavachIQ is a specialized website security provider in West Bengal. We protect business websites from malware, SSL issues, data loss, and hacks with easy-to-understand cyber defense packages."
  }
];

function getBotResponse(userText) {
  const normalized = userText.toLowerCase();
  for (const entry of faqDatabase) {
    for (const key of entry.keywords) {
      if (normalized.includes(key)) {
        return entry.answer;
      }
    }
  }
  return "I'm not sure I fully understand that question. 🛡️ You can ask about our 'Free Health Check', 'Secure Website Package', 'Protection Plan', or how to 'Book a Consultation'. Or simply fill out the contact form below, and we'll get back to you!";
}

const chatbotToggle = document.querySelector("[data-chatbot-toggle]");
const chatbotWindow = document.querySelector("[data-chatbot-window]");
const chatClose = document.querySelector("[data-chat-close]");
const chatForm = document.querySelector("[data-chat-input-form]");
const chatInput = chatForm ? chatForm.querySelector("input") : null;
const chatMessages = document.querySelector("[data-chat-messages]");
const chatSuggestions = document.querySelector("[data-chat-suggestions]");

if (chatbotToggle && chatbotWindow) {
  chatbotToggle.addEventListener("click", () => {
    const isOpen = chatbotWindow.classList.toggle("is-open");
    chatbotWindow.setAttribute("aria-hidden", !isOpen);
  });
}

if (chatClose) {
  chatClose.addEventListener("click", () => {
    chatbotWindow.classList.remove("is-open");
    chatbotWindow.setAttribute("aria-hidden", "true");
  });
}

function appendChatMessage(text, isUser = false) {
  if (!chatMessages) return;
  const msgDiv = document.createElement("div");
  msgDiv.className = `chat-message ${isUser ? "user-msg" : "bot-msg"}`;
  
  // Basic markdown bolding converter: **text** to <strong>text</strong>
  const htmlContent = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  msgDiv.innerHTML = `<p>${htmlContent}</p>`;
  
  chatMessages.appendChild(msgDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

if (chatForm && chatInput) {
  chatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const query = chatInput.value.trim();
    if (!query) return;
    
    appendChatMessage(query, true);
    chatInput.value = "";
    
    setTimeout(() => {
      const response = getBotResponse(query);
      appendChatMessage(response, false);
    }, 450 + Math.random() * 200);
  });
}

if (chatSuggestions) {
  chatSuggestions.addEventListener("click", (e) => {
    const btn = e.target.closest(".suggestion-btn");
    if (!btn) return;
    
    const question = btn.getAttribute("data-question");
    appendChatMessage(question, true);
    
    setTimeout(() => {
      const response = getBotResponse(question);
      appendChatMessage(response, false);
    }, 450 + Math.random() * 200);
  });
}

// 10. LEAD GENERATION POPUP SYSTEM
const leadPopup = document.querySelector("[data-lead-popup]");
const popupClose = document.querySelector("[data-popup-close]");
const miniLeadForm = document.querySelector(".mini-lead-form");

if (leadPopup) {
  // Show popup after 12 seconds
  setTimeout(() => {
    if (!sessionStorage.getItem("lead-popup-closed")) {
      leadPopup.classList.add("is-active");
      leadPopup.setAttribute("aria-hidden", "false");
    }
  }, 12000);
}

if (popupClose && leadPopup) {
  popupClose.addEventListener("click", () => {
    leadPopup.classList.remove("is-active");
    leadPopup.setAttribute("aria-hidden", "true");
    sessionStorage.setItem("lead-popup-closed", "true");
  });
}

if (miniLeadForm && leadPopup) {
  miniLeadForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const note = document.querySelector("[data-popup-note]");
    const submitBtn = miniLeadForm.querySelector("button[type='submit']");
    const originalText = submitBtn ? submitBtn.textContent : null;

    if (submitBtn) { submitBtn.textContent = "Sending..."; submitBtn.disabled = true; }
    if (note) { note.textContent = "Submitting..."; note.style.color = "var(--cyan)"; }

    const data = Object.fromEntries(new FormData(miniLeadForm));
    const payload = {
      formType: "popup",
      website:  data["website"] || "",
      email:    data["email"]   || ""
    };

    const ok = await submitToGoogleSheets(payload);

    if (submitBtn) { submitBtn.textContent = originalText; submitBtn.disabled = false; }

    if (note) {
      note.textContent = ok
        ? "✓ Report request sent! We will review your site."
        : "⚠ Submission failed. Try again or use WhatsApp.";
      note.style.color = ok ? "var(--green)" : "#ff6b6b";
    }

    if (ok) {
      setTimeout(() => {
        leadPopup.classList.remove("is-active");
        leadPopup.setAttribute("aria-hidden", "true");
        sessionStorage.setItem("lead-popup-closed", "true");
      }, 2200);
    }
  });
}

resizeCanvas();
drawThreatMap();
handleHeaderState();
runTerminalSimulation();

// ── Lottie Player Interaction ───────────────────────────────────
(function initLottie() {
  const lottieEl = document.getElementById("hero-lottie");
  if (!lottieEl) return;

  // Fade-in the Lottie element with a slight delay for dramatic effect
  lottieEl.style.opacity = "0";
  lottieEl.style.transform = "scale(0.88) translateY(20px)";
  lottieEl.style.transition = "opacity 900ms ease, transform 900ms cubic-bezier(0.22,1,0.36,1)";

  setTimeout(() => {
    lottieEl.style.opacity = "1";
    lottieEl.style.transform = "scale(1) translateY(0)";
  }, 400);

  // Pause/play based on visibility for performance
  if ("IntersectionObserver" in window) {
    const lottieObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (typeof lottieEl.play === "function") lottieEl.play();
          } else {
            if (typeof lottieEl.pause === "function") lottieEl.pause();
          }
        });
      },
      { threshold: 0.1 }
    );
    lottieObserver.observe(lottieEl);
  }

  // Fallback: if lottie-player doesn't render in 5s, show a CSS shield animation
  setTimeout(() => {
    const shadow = lottieEl.shadowRoot;
    const rendered = shadow && shadow.querySelector("svg, canvas");
    if (!rendered) {
      lottieEl.style.display = "none";
      const fallback = document.createElement("div");
      fallback.className = "lottie-css-fallback";
      fallback.innerHTML = `
        <div class="css-shield">
          <svg viewBox="0 0 80 90" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M40 4L8 18V46c0 20 14 35 32 42 18-7 32-22 32-42V18L40 4Z"
              fill="rgba(32,231,255,0.08)" stroke="rgba(32,231,255,0.7)" stroke-width="2"/>
            <path d="M40 14L16 25V46c0 15 10.5 26 24 31.5C53.5 72 64 61 64 46V25L40 14Z"
              fill="rgba(57,255,136,0.07)" stroke="rgba(57,255,136,0.5)" stroke-width="1.5"/>
            <path d="M30 44l7 7 14-14" stroke="#39ff88" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>`;
      const lottieContainer = lottieEl.closest(".hero-lottie");
      if (lottieContainer) lottieContainer.insertBefore(fallback, lottieEl);
    }
  }, 5000);
})();
