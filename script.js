// ClauseGuard — AI-Powered Contract Reviewer
// MVP Implementation with Mock AI Analysis

// ===== STATE MANAGEMENT =====
let appState = {
  currentPage: 'landing',
  contractText: '',
  analysisResult: null,
  selectedPricing: 'oneTime',
  isPurchased: false,
};

// ===== PAGE NAVIGATION =====
function showPage(pageName) {
  // Hide all pages
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });
  
  // Show target page with animation
  const targetPage = document.getElementById(pageName + '-page');
  if (targetPage) {
    targetPage.classList.add('active');
    appState.currentPage = pageName;
    
    // Page-specific setup
    if (pageName === 'upload') {
      setupUploadHandlers();
    }
  }
}

// ===== UPLOAD HANDLERS =====
function setupUploadHandlers() {
  const uploadZone = document.getElementById('uploadZone');
  const uploadInput = document.getElementById('uploadInput');
  const uploadButton = document.getElementById('uploadButton');
  const pasteTextarea = document.getElementById('pasteTextarea');

  // Click to upload
  uploadZone.addEventListener('click', () => uploadInput.click());

  // File input change
  uploadInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileUpload(file);
    }
  });

  // Drag and drop
  uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('dragover');
  });

  uploadZone.addEventListener('dragleave', () => {
    uploadZone.classList.remove('dragover');
  });

  uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  });

  // Paste textarea
  pasteTextarea.addEventListener('input', () => {
    uploadButton.disabled = !pasteTextarea.value.trim();
  });

  // Enable upload button when text is pasted
  uploadButton.disabled = !pasteTextarea.value.trim();
}

function togglePasteArea() {
  const pasteArea = document.getElementById('pasteArea');
  pasteArea.classList.toggle('active');
  if (pasteArea.classList.contains('active')) {
    document.getElementById('pasteTextarea').focus();
  }
}

function handleFileUpload(file) {
  const reader = new FileReader();
  
  reader.onload = async (e) => {
    const fileType = file.name.split('.').pop().toLowerCase();
    
    if (fileType === 'pdf') {
      await extractPdfText(e.target.result);
    } else if (fileType === 'txt') {
      appState.contractText = new TextDecoder().decode(e.target.result);
      enableUploadButton();
    } else if (fileType === 'docx') {
      // For MVP, treat docx as text
      appState.contractText = new TextDecoder().decode(e.target.result);
      enableUploadButton();
    }
  };
  
  reader.readAsArrayBuffer(file);
}

async function extractPdfText(arrayBuffer) {
  try {
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let text = '';
    
    for (let i = 1; i <= Math.min(pdf.numPages, 10); i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      text += textContent.items.map(item => item.str).join(' ') + '\n';
    }
    
    appState.contractText = text;
    enableUploadButton();
  } catch (error) {
    console.error('PDF extraction error:', error);
    appState.contractText = '[PDF parsing failed - please paste text instead]';
    enableUploadButton();
  }
}

function enableUploadButton() {
  document.getElementById('uploadButton').disabled = false;
  document.getElementById('uploadZone').classList.remove('dragover');
}

// ===== ANALYSIS ENGINE =====
async function analyzeContract() {
  // Get contract text from upload or paste
  const pasteTextarea = document.getElementById('pasteTextarea');
  const contractText = pasteTextarea.value.trim() || appState.contractText;
  
  if (!contractText) {
    alert('Please upload or paste a contract first.');
    return;
  }
  
  appState.contractText = contractText;
  
  // Show loading page
  showPage('loading');
  simulateLoading();
  
  // Simulate AI analysis with delay
  setTimeout(() => {
    const analysis = performMockAnalysis(contractText);
    appState.analysisResult = analysis;
    displayResults(analysis);
    showPage('results');
  }, 3000);
}

function simulateLoading() {
  const messages = [
    'Reading your contract...',
    'Identifying risky clauses...',
    'Generating your protection report...'
  ];
  
  let index = 0;
  const messageElement = document.getElementById('loadingMessage');
  
  const interval = setInterval(() => {
    messageElement.textContent = messages[index % messages.length];
    index++;
    if (index > messages.length) clearInterval(interval);
  }, 800);
}

// ===== MOCK AI ANALYSIS ENGINE =====
function performMockAnalysis(contractText) {
  // Simulate AI analysis based on keywords in the contract
  const hasNonCompete = /non-compete|non compete|noncompete/i.test(contractText);
  const hasUnlimitedIP = /intellectual property|ip ownership|all work product|forever/i.test(contractText);
  const hasCancellation = /termination|cancel|terminate|kill fee/i.test(contractText);
  const hasPaymentTerms = /payment|fee|invoice|due/i.test(contractText);
  const hasConfidentiality = /confidential|nda|non-disclosure/i.test(contractText);
  
  // Calculate risk score
  let riskScore = 50;
  if (hasNonCompete) riskScore += 15;
  if (hasUnlimitedIP) riskScore += 15;
  if (hasCancellation) riskScore -= 10;
  if (hasConfidentiality) riskScore -= 5;
  riskScore = Math.min(100, Math.max(0, riskScore));
  
  // Determine risk level
  let riskLevel = 'LOW';
  if (riskScore >= 0 && riskScore <= 40) riskLevel = 'HIGH';
  else if (riskScore > 40 && riskScore <= 70) riskLevel = 'MEDIUM';
  else riskLevel = 'LOW';
  
  // Generate summary
  const summary = generateContractSummary(contractText, hasNonCompete, hasUnlimitedIP, hasPaymentTerms);
  
  // Generate flagged clauses
  const flaggedClauses = generateFlaggedClauses(hasNonCompete, hasUnlimitedIP, hasCancellation, hasPaymentTerms);
  
  // Generate safe clauses
  const safeClauses = generateSafeClauses(hasConfidentiality);
  
  // Generate negotiation items
  const negotiationItems = generateNegotiationItems(hasNonCompete, hasUnlimitedIP, hasCancellation);
  
  return {
    riskScore,
    riskLevel,
    summary,
    summaryBullets: summary.bullets,
    flaggedClauses,
    safeClauses,
    negotiationItems
  };
}

function generateContractSummary(text, hasNonCompete, hasUnlimitedIP, hasPaymentTerms) {
  const summaryText = `This is a ${text.length > 500 ? 'comprehensive' : 'standard'} service contract between the parties. The agreement outlines the scope of work, compensation terms, intellectual property rights, and termination conditions. Payment is typically due upon completion or as specified in the contract terms. The contract ${hasNonCompete ? 'includes a non-compete clause' : 'does not restrict competitive work'} and ${hasUnlimitedIP ? 'assigns all IP ownership to the client' : 'allows you to retain some IP rights'}.`;
  
  const bullets = [
    '<strong>Parties:</strong> Service provider and client company',
    `<strong>Scope:</strong> ${text.length > 500 ? 'Comprehensive project work' : 'Specific service delivery'}`,
    `<strong>Payment:</strong> ${hasPaymentTerms ? 'Structured payment terms' : 'Terms to be negotiated'}`,
    '<strong>Duration:</strong> Project-based engagement',
    `<strong>IP Rights:</strong> ${hasUnlimitedIP ? 'Client owns all work product' : 'Standard IP allocation'}`
  ];
  
  return { text: summaryText, bullets };
}

function generateFlaggedClauses(hasNonCompete, hasUnlimitedIP, hasCancellation, hasPaymentTerms) {
  const clauses = [];
  
  if (hasNonCompete) {
    clauses.push({
      severity: 'HIGH',
      title: 'Non-Compete Clause',
      original: 'The Contractor agrees not to work with competitors of the Client for a period of 2 years following the termination of this agreement, in any geographical region.',
      plainEnglish: 'You cannot work with any company similar to the client for 2 years after the project ends, anywhere in the world.',
      whyRisky: 'This is extremely restrictive and could prevent you from working with most companies in your industry. 2 years is far too long for a freelancer.',
      suggestion: 'Ask them to limit it to 6 months and only within your specific industry/region. Better yet, remove it entirely or define specific competitors.'
    });
  }
  
  if (hasUnlimitedIP) {
    clauses.push({
      severity: 'HIGH',
      title: 'Unlimited IP Assignment',
      original: 'All work product, including preliminary drafts, concepts, and any materials created during the engagement shall be the exclusive property of the Client in perpetuity.',
      plainEnglish: 'The client owns everything you create, even rough drafts and ideas. They keep it forever.',
      whyRisky: 'This means you cannot reuse techniques, templates, or methodologies you develop. You lose all rights to your own work.',
      suggestion: 'Propose that you retain rights to your general methodologies and pre-existing tools. Only the final deliverable belongs to the client.'
    });
  }
  
  if (hasCancellation) {
    clauses.push({
      severity: 'MEDIUM',
      title: 'Termination Without Cause',
      original: 'Either party may terminate this agreement at any time without cause by providing written notice.',
      plainEnglish: 'The client can cancel the project anytime, for any reason, with just a notice.',
      whyRisky: 'You could lose income mid-project with no protection or payment for work already done.',
      suggestion: 'Require a kill fee (at least 25-50% of remaining contract value) if they terminate without cause after kick-off.'
    });
  }
  
  if (hasPaymentTerms) {
    clauses.push({
      severity: 'MEDIUM',
      title: 'Vague Payment Terms',
      original: 'Payment shall be made upon completion of the project to the satisfaction of the Client.',
      plainEnglish: 'You get paid when the client decides the work is "good enough" — which is subjective.',
      whyRisky: 'The client can claim work is incomplete or unsatisfactory to avoid paying you. Very common dispute trigger.',
      suggestion: 'Use milestone-based payments (e.g., 33% upfront, 33% at halfway, 34% on delivery). Define "completion" clearly.'
    });
  }
  
  if (clauses.length === 0) {
    clauses.push({
      severity: 'MEDIUM',
      title: 'Standard Services Agreement',
      original: 'The Contractor will provide services as outlined in the attached scope of work.',
      plainEnglish: 'You agree to do the work described in the project scope.',
      whyRisky: 'Watch out for scope creep — ensure the scope of work is very specific.',
      suggestion: 'Add a change request process. Any work outside the original scope should require written approval and additional payment.'
    });
  }
  
  return clauses.slice(0, 5);
}

function generateSafeClauses(hasConfidentiality) {
  const safe = [];
  
  if (hasConfidentiality) {
    safe.push({
      name: 'Confidentiality Clause',
      description: 'Standard and protects both parties'
    });
  }
  
  safe.push(
    { name: 'Governing Law', description: 'Clear jurisdiction specified' },
    { name: 'Professional Services', description: 'Standard industry language' },
    { name: 'Limitation of Liability', description: 'Reasonable caps on damages' }
  );
  
  return safe;
}

function generateNegotiationItems(hasNonCompete, hasUnlimitedIP, hasCancellation) {
  const items = [];
  
  if (hasNonCompete) {
    items.push('Ask them to remove or limit the non-compete to 6 months and your specific industry only.');
  }
  
  if (hasUnlimitedIP) {
    items.push('Request that you retain rights to general methodologies, pre-existing tools, and standard practices. Only final deliverables go to client.');
  }
  
  if (hasCancellation) {
    items.push('Request a kill fee of at least 25% if the project is cancelled after kick-off. For long projects, ask for graduated fees.');
  }
  
  items.push(
    'Ensure the payment clause specifies exact dates, not vague terms like "upon completion." Use milestone-based payments if possible.',
    'Add a 30-day notice requirement for any contract changes. You shouldn\'t have to accept scope changes on the fly.',
    'Define what "acceptable work" means. Get clarity on deliverables and revision limits upfront.'
  );
  
  return items.slice(0, 5);
}

// ===== RESULTS DISPLAY =====
function displayResults(analysis) {
  // Update risk score section
  document.getElementById('riskScore').textContent = `${analysis.riskScore}/100`;
  
  // Update shield color and emoji
  const shield = document.getElementById('riskShield');
  if (analysis.riskLevel === 'HIGH') {
    shield.textContent = '🛡️';
    shield.style.color = '#E84040';
  } else if (analysis.riskLevel === 'MEDIUM') {
    shield.textContent = '🛡️';
    shield.style.color = '#F5A623';
  } else {
    shield.textContent = '🛡️';
    shield.style.color = '#00C896';
  }
  
  // Update verdict
  const verdictElement = document.getElementById('riskVerdict');
  const verdictClass = 'verdict-' + analysis.riskLevel.toLowerCase();
  verdictElement.className = 'risk-verdict ' + verdictClass;
  
  if (analysis.riskLevel === 'HIGH') {
    verdictElement.textContent = '⚠️ This contract has serious red flags. Do not sign without reading this report.';
  } else if (analysis.riskLevel === 'MEDIUM') {
    verdictElement.textContent = '👤 A few clauses need attention before you sign.';
  } else {
    verdictElement.textContent = '✅ This contract looks mostly fair. Minor suggestions below.';
  }
  
  // Update summary
  document.getElementById('summarySummary').textContent = analysis.summary.text;
  const bulletsContainer = document.getElementById('summaryBullets');
  bulletsContainer.innerHTML = analysis.summaryBullets
    .map(bullet => `<div class="summary-bullet">${bullet}</div>`)
    .join('');
  
  // Display flagged clauses
  displayFlaggedClauses(analysis.flaggedClauses);
  
  // Display safe clauses
  if (analysis.safeClauses.length > 0) {
    document.getElementById('safeSection').style.display = 'block';
    const safeList = document.getElementById('safeClausesList');
    safeList.innerHTML = analysis.safeClauses
      .map(clause => `
        <div class="safe-item">
          <div class="safe-item-icon">✓</div>
          <div>
            <strong>${clause.name}</strong> — ${clause.description}
          </div>
        </div>
      `)
      .join('');
  }
  
  // Display negotiation items
  if (analysis.negotiationItems.length > 0) {
    document.getElementById('negotiationSection').style.display = 'block';
    const itemsContainer = document.getElementById('negotiationItems');
    itemsContainer.innerHTML = analysis.negotiationItems
      .map(item => `<div class="negotiation-item">${item}</div>`)
      .join('');
  }
}

function displayFlaggedClauses(clauses) {
  const container = document.getElementById('flaggedClausesContainer');
  const freeClausesCount = 2;
  
  container.innerHTML = clauses
    .map((clause, index) => `
      <div class="clause-card" data-clause-index="${index}">
        <div class="clause-header" onclick="toggleClause(this)">
          <div class="clause-header-left">
            <div class="clause-badge badge-${clause.severity.toLowerCase().replace(/\s+/g, '-')}">${clause.severity}</div>
            <div class="clause-title">${clause.title}</div>
          </div>
          <button class="clause-toggle">▼</button>
        </div>
        <div class="clause-content">
          <div class="clause-text-label">Original Clause</div>
          <div class="clause-original">"${clause.original}"</div>
          
          <div class="plain-english">
            <strong>What this means:</strong> ${clause.plainEnglish}
          </div>
          
          <div class="why-risky">
            <strong>Why it's risky:</strong> ${clause.whyRisky}
          </div>
          
          <div class="ai-suggestion">
            <div class="ai-suggestion-label">🍷 Suggested rewrite:</div>
            <div>${clause.suggestion}</div>
          </div>
        </div>
      </div>
    `)
    .join('');
  
  // Lock clauses beyond free tier
  if (clauses.length > freeClausesCount) {
    const lockedContainer = document.getElementById('lockedFlaggedClauses');
    lockedContainer.style.display = 'block';
    
    // Make excess clauses unclickable
    document.querySelectorAll('.clause-card').forEach((card, index) => {
      if (index >= freeClausesCount && !appState.isPurchased) {
        card.style.opacity = '0.5';
        card.style.pointerEvents = 'none';
      }
    });
  }
}

function toggleClause(header) {
  const content = header.nextElementSibling;
  const toggle = header.querySelector('.clause-toggle');
  
  content.classList.toggle('active');
  toggle.classList.toggle('open');
}

// ===== PAYWALL LOGIC =====
function openPaywall() {
  document.getElementById('paywallOverlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closePaywall() {
  document.getElementById('paywallOverlay').classList.remove('active');
  document.body.style.overflow = 'auto';
}

function selectPricing(type, element) {
  // Update selected state
  document.querySelectorAll('.pricing-option').forEach(opt => {
    opt.classList.remove('selected');
    opt.querySelector('.pricing-radio').classList.remove('checked');
  });
  
  element.classList.add('selected');
  element.querySelector('.pricing-radio').classList.add('checked');
  appState.selectedPricing = type;
}

function processPayment() {
  const amount = appState.selectedPricing === 'oneTime' ? '$7' : '$19';
  
  // Show Stripe mock payment modal
  alert(`Redirecting to Stripe payment...\n\nAmount: ${amount}\nPricing: ${appState.selectedPricing === 'oneTime' ? 'One-time' : 'Monthly Subscription'}\n\nFor MVP demo purposes, this payment is simulated.`);
  
  // Simulate successful payment
  completePayment();
}

function completePayment() {
  appState.isPurchased = true;
  closePaywall();
  unlockFullReport();
  
  // Show success message
  alert('🎉 Payment successful! Your full report is now unlocked.');
}

function unlockFullReport() {
  // Remove locked state from all clauses
  document.querySelectorAll('.clause-card').forEach(card => {
    card.style.opacity = '1';
    card.style.pointerEvents = 'auto';
  });
  
  // Hide locked banner
  const lockedBanner = document.getElementById('lockedFlaggedClauses');
  if (lockedBanner) {
    lockedBanner.style.display = 'none';
  }
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
  // Set up navigation
  document.querySelector('.nav-cta').addEventListener('click', () => {
    showPage('upload');
  });
  
  // PDF.js setup
  if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }
  
  console.log('ClauseGuard MVP loaded successfully');
});

// Close paywall on overlay click
document.addEventListener('DOMContentLoaded', () => {
  const overlay = document.getElementById('paywallOverlay');
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closePaywall();
    }
  });
});