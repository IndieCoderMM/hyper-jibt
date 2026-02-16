const input1 = document.getElementById("url1");
const input2 = document.getElementById("url2");
const pHashOut1 = document.getElementById("phash-out1");
const pHashOut2 = document.getElementById("phash-out2");
const uuidOut1 = document.getElementById("uuid-out1");
const uuidOut2 = document.getElementById("uuid-out2");
const phashCard = document.getElementById("phashCard");
const uuidCard = document.getElementById("uuidCard");
const phashBadge = document.getElementById("phashBadge");
const uuidBadge = document.getElementById("uuidBadge");
const phashSimilarity = document.getElementById("phashSimilarity");
const uuidSimilarity = document.getElementById("uuidSimilarity");
const phashTime = document.getElementById("phashTime");
const uuidTime = document.getElementById("uuidTime");
const bitsSlider = document.getElementById("pHashBits");
const bitsValue = document.getElementById("pHashBitsValue");
const bytesSlider = document.getElementById("uuidBytes");
const bytesValue = document.getElementById("uuidBytesValue");

bitsSlider.addEventListener("input", () => {
  bitsValue.textContent = bitsSlider.value;
});

bytesSlider.addEventListener("input", () => {
  bytesValue.textContent = bytesSlider.value;
});

async function run() {
  const url1 = input1.value.trim();
  const url2 = input2.value.trim();
  const bits = parseInt(bitsSlider.value, 10);
  const bytes = parseInt(bytesSlider.value, 10);

  if (!url1 || !url2) return alert("Please enter both URLs.");

  pHashOut1.value = "Loading...";
  pHashOut2.value = "Loading...";
  uuidOut1.value = "Loading...";
  uuidOut2.value = "Loading...";
  phashSimilarity.textContent = "-";
  uuidSimilarity.textContent = "-";
  phashTime.textContent = "-";
  uuidTime.textContent = "-";
  phashBadge.style.display = "none";
  uuidBadge.style.display = "none";

  const uuidStart = performance.now();
  const uHash1 = uuidHash(url1, Math.min(16, Math.max(6, bytes)));
  const uHash2 = uuidHash(url2, Math.min(16, Math.max(6, bytes)));
  const uuidEnd = performance.now();
  const uHash1B64 = safeBase64(uHash1);
  const uHash2B64 = safeBase64(uHash2);

  uuidOut1.value = uHash1B64;
  uuidOut2.value = uHash2B64;
  uuidTime.textContent = (uuidEnd - uuidStart).toFixed(2) + "ms";

  const isUuidMatch = uHash1B64 === uHash2B64;
  uuidSimilarity.textContent = isUuidMatch ? "100%" : "0%";
  uuidBadge.style.display = "inline-flex";
  uuidBadge.className = "badge " + (isUuidMatch ? "match" : "different");
  uuidBadge.textContent = isUuidMatch ? "✓ Match" : "✗ Different";

  let pHash1 = null;
  let pHash2 = null;
  const pHashStart = performance.now();

  try {
    pHash1 = await runPHash(url1, Math.min(32, Math.max(4, bits)));
    pHashOut1.value = safeBase64(pHash1.toBase64());
  } catch (e) {
    pHashOut1.value = "Error: " + e.message;
  }

  try {
    pHash2 = await runPHash(url2, Math.min(32, Math.max(4, bits)));
    pHashOut2.value = safeBase64(pHash2.toBase64());
  } catch (e) {
    pHashOut2.value = "Error: " + e.message;
  }

  const pHashEnd = performance.now();
  phashTime.textContent = (pHashEnd - pHashStart).toFixed(2) + "ms";

  if (pHash1 && pHash2) {
    const maxDist = pHash1.binArray.length;
    const dist = pHash1.hammingDistance(pHash2);
    const sim = Math.max(0, ((maxDist - dist) / maxDist) * 100);
    phashSimilarity.textContent = sim.toFixed(1) + "%";
    phashBadge.style.display = "inline-flex";
    phashBadge.className = "badge " + (sim === 100 ? "match" : "different");
    phashBadge.textContent = sim === 100 ? "✓ Match" : "✗ Different";
  }
}

async function runPHash(url, bits) {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = url;
  await img.decode();
  return await phash(img, bits);
}

function uuidHash(url, keepBytes = 12) {
  if (!url || typeof url !== 'string') throw new Error('URL is required')
  if (keepBytes < 6 || keepBytes > 16)
    throw new Error('keepBytes must be 6..16')

  const { v5, parse } = uuid

  const normalized = normalizeUrl(url)
  const hashed = v5(normalized, v5.URL)
  const bytes = parse(hashed)
  const truncated = bytes.slice(0, keepBytes)

  let binary = ''
  for (let i = 0; i < truncated.length; i++)
    binary += String.fromCharCode(truncated[i])
  const b64 = globalThis.btoa(binary)

  return b64
}

function safeBase64(str) {
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function normalizeUrl(url) {
  if (!url) return ''
  let u = url.startsWith('data:')
    ? url.trim().slice(-200)
    : url.trim().slice(0, 200)
  u = u.replace(/^https?:\/\//i, '')
  u = u.replace(/^www\./i, '')
  u = u.replace(/\/+$/, '')
  u = u.replace(/^data:.*?,/, '')
  return u.toLowerCase()
}
