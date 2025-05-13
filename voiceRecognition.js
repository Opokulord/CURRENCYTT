function startVoiceRecognition() {
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  // Default to English, but allow language switching
  recognition.lang = 'en-US';
  recognition.interimResults = true;
  recognition.continuous = true;
  recognition.maxAlternatives = 3;

  const amountInput = document.getElementById('amount');
  const fromCurrencySelect = document.getElementById('fromCurrency');
  const toCurrencySelect = document.getElementById('toCurrency');
  const convertButton = document.getElementById('convertButton');
  const originalPlaceholder = amountInput.placeholder;
  let isListening = false;
  let timeoutId = null;
  let currentLanguage = 'en-US';

  // Helper to (re)attach the voice button click handler
  function attachVoiceBtnHandler() {
    const voiceBtn = document.querySelector('.voice-btn');
    if (!voiceBtn) return;
    voiceBtn.onclick = null;
    if (!voiceBtn.disabled) {
      voiceBtn.onclick = function() {
        try {
          recognition.start();
        } catch (error) {}
      };
    }
  }

  // Create classic voice input UI
  function createVoiceInputUI() {
    // Remove any existing container
    const oldContainer = document.querySelector('.voice-ui-container');
    if (oldContainer) oldContainer.remove();

    // Main section container (inside .converter)
    const container = document.createElement('div');
    container.className = 'voice-ui-container';
    container.style = `
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      gap: 6px;
      margin: 24px 0 0 0;
      padding: 18px 18px 10px 18px;
      background: rgba(40, 30, 35, 0.92);
      border-radius: 22px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.10);
      width: 95%;
      min-width: 0;
      border: 2px solid #3b82f6;
    `;

    // Language selector (pill style, row)
    const langSelector = document.createElement('div');
    langSelector.className = 'voice-lang-selector';
    langSelector.style = `
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 18px;
      flex: 0 0 auto;
      margin-bottom: 10px;
    `;
    const languages = [
      { code: 'en-US', name: 'Eng', flag: '🇺🇸', symbol: '$' },
      { code: 'fr-FR', name: 'Fr', flag: '🇫🇷', symbol: '€' },
      { code: 'es-ES', name: 'Sp', flag: '🇪🇸', symbol: '€' },
      { code: 'de-DE', name: 'Ger', flag: '🇩🇪', symbol: '€' },
      { code: 'it-IT', name: 'Ita', flag: '🇮🇹', symbol: '€' }
    ];
    languages.forEach(lang => {
      const btn = document.createElement('button');
      btn.className = 'lang-btn';
      btn.innerHTML = `<span style="font-size:1.2em;">${lang.flag}</span> <span style="margin-left:7px; font-weight:600;">${lang.name}</span>`;
      btn.title = lang.name;
      btn.style = `
        display: flex;
        align-items: center;
        gap: 7px;
        background: rgba(255,255,255,0.10);
        color: #fff;
        border: none;
        border-radius: 14px;
        font-size: 1rem;
        font-family: 'Poppins', sans-serif;
        padding: 8px 16px;
        margin: 0;
        cursor: pointer;
        transition: background 0.2s, box-shadow 0.2s, transform 0.2s;
      `;
      btn.onclick = () => {
        currentLanguage = lang.code;
        recognition.lang = lang.code;
        langSelector.querySelectorAll('.lang-btn').forEach(b => b.style.background = 'rgba(255,255,255,0.10)');
        btn.style.background = 'linear-gradient(90deg, #3b82f6 60%, #93c5fd 100%)';
        btn.style.color = '#fff';
        micBtn.disabled = false;
        micBtn.style.opacity = 1;
        setStatus(messages[lang.code].listening, '#3b82f6');
      };
      langSelector.appendChild(btn);
    });
    container.appendChild(langSelector);

    // Status + mic + stop (centered below)
    const controlsRow = document.createElement('div');
    controlsRow.style = `
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;
      gap: 18px;
      width: 100%;
      margin-top: 8px;
    `;
    // Status text
    const status = document.createElement('div');
    status.className = 'voice-status';
    status.style = `
      font-size: 1.1rem;
      color: #3b82f6;
      text-align: left;
      font-weight: 600;
      font-family: 'Poppins', serif;
      margin-bottom: 0;
      line-height: 1.2;
      min-width: 120px;
      max-width: 220px;
      overflow-wrap: break-word;
    `;
    status.textContent = 'Select a language to start';
    controlsRow.appendChild(status);
    // Mic button
    const micBtn = document.createElement('button');
    micBtn.className = 'voice-btn';
    micBtn.innerHTML = '<span class="mic-anim">🎤</span>';
    micBtn.title = 'Start voice input';
    micBtn.disabled = true;
    micBtn.style = `
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #3b82f6 60%, #93c5fd 100%);
      border: none;
      border-radius: 50%;
      width: 54px;
      height: 54px;
      box-shadow: 0 4px 16px rgba(59,130,246,0.2), 0 0 0 8px rgba(59,130,246,0.1);
      color: #ffffff;
      font-size: 1.5rem;
      cursor: pointer;
      opacity: 0.7;
      transition: box-shadow 0.3s, background 0.3s, color 0.3s, opacity 0.3s;
    `;
    controlsRow.appendChild(micBtn);
    // Stop button (hidden by default)
    const stopBtn = document.createElement('button');
    stopBtn.className = 'stop-btn';
    stopBtn.innerHTML = '<span style="font-size:1.2rem;">⏹️</span>';
    stopBtn.title = 'Stop listening';
    stopBtn.style = `
      display: none;
      background: linear-gradient(135deg, #cf6679 60%, #fffbe6 100%);
      border: none;
      border-radius: 50%;
      width: 44px;
      height: 44px;
      color: #23233b;
      font-size: 1.2rem;
      box-shadow: 0 2px 12px #cf667944, 0 0 0 6px rgba(207,102,121,0.10);
      cursor: pointer;
      align-items: center;
      justify-content: center;
      transition: background 0.3s, box-shadow 0.3s;
      margin-left: 0;
    `;
    controlsRow.appendChild(stopBtn);
    container.appendChild(controlsRow);

    // Insert the UI into the .converter div
    const converter = document.querySelector('.converter');
    if (converter) {
      const result = converter.querySelector('#result');
      const trend = converter.querySelector('#trendResult');
      if (trend && trend.nextSibling) {
        converter.insertBefore(container, trend.nextSibling);
      } else if (trend) {
        converter.appendChild(container);
      } else if (result && result.nextSibling) {
        converter.insertBefore(container, result.nextSibling);
      } else if (result) {
        converter.appendChild(container);
      } else {
        converter.appendChild(container);
      }
    } else {
      document.body.appendChild(container);
    }

    // Status update helper
    function setStatus(text, color) {
      status.textContent = text;
      status.style.color = color || '#3b82f6';
    }

    // Mic button click handler (toggle start/stop)
    micBtn.onclick = function() {
      if (micBtn.disabled) return;
      if (!isListening) {
        try {
          recognition.start();
        } catch (error) {}
      } else {
        stopRecognition();
      }
    };

    // Remove the separate stop button if present
    if (stopBtn && stopBtn.parentNode) {
      stopBtn.parentNode.removeChild(stopBtn);
    }

    // Update mic icon based on listening state
    function updateMicIcon(listening) {
      if (listening) {
        micBtn.innerHTML = '<span class="mic-anim">⏹️</span>';
        micBtn.title = 'Stop voice input';
      } else {
        micBtn.innerHTML = '<span class="mic-anim">🎤</span>';
        micBtn.title = 'Start voice input';
      }
    }

    // Expose for use in recognition events
    window._voiceUI = { setStatus, micBtn, status, updateMicIcon };
  }

  // Create language selection UI
  function createLanguageSelector() {
    // Remove any existing language selector
    const oldSelector = document.querySelector('.language-selector');
    if (oldSelector) oldSelector.remove();

    // Hide the voice input button by default
    const voiceBtn = document.querySelector('.voice-btn');
    if (voiceBtn) {
      voiceBtn.style.display = 'none';
    }

    // Create container for language flags
    const container = document.createElement('div');
    container.className = 'language-selector';
    container.style = `
      display: inline-flex;
      gap: 5px;
      margin-left: 10px;
      vertical-align: middle;
    `;

    // Create language buttons
    const languages = [
      { code: 'en-US', name: 'English', flag: '🇺🇸', symbol: '🌐' },
      { code: 'fr-FR', name: 'French', flag: '🇫🇷', symbol: '🗣️' },
      { code: 'es-ES', name: 'Spanish', flag: '🇪🇸', symbol: '💬' },
      { code: 'de-DE', name: 'German', flag: '🇩🇪', symbol: '🎯' },
      { code: 'it-IT', name: 'Italian', flag: '🇮🇹', symbol: '🎯' }
    ];

    languages.forEach(lang => {
      const button = document.createElement('button');
      button.className = 'lang-btn';
      button.innerHTML = `${lang.flag}`;
      button.title = `${lang.name} (${lang.symbol})`;
      button.style = `
        padding: 6px 8px;
        border-radius: 4px;
        background: rgba(255,255,255,0.1);
        color: white;
        border: none;
        cursor: pointer;
        font-size: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
        min-width: 32px;
        height: 32px;
      `;

      button.onclick = () => {
        // Update current language
        currentLanguage = lang.code;
        recognition.lang = lang.code;

        // Update button styles
        container.querySelectorAll('.lang-btn').forEach(btn => {
          btn.style.background = 'rgba(255,255,255,0.1)';
        });
        button.style.background = 'rgba(255,255,255,0.3)';

        // Show and enable the voice button after language selection
        if (voiceBtn) {
          voiceBtn.style.display = 'inline-flex';
          voiceBtn.disabled = false;
          voiceBtn.style.opacity = 1;
          voiceBtn.title = '';
          attachVoiceBtnHandler();
          // Move the voice button next to the selected flag
          button.parentNode.insertBefore(voiceBtn, button.nextSibling);
        }

        // Restart recognition if active
        if (isListening) {
          stopRecognition();
          startRecognition();
        }
      };

      container.appendChild(button);
    });

    // Insert the language selector at the right place
    if (voiceBtn && voiceBtn.parentNode) {
      voiceBtn.parentNode.insertBefore(container, voiceBtn);
    }
  }

  // Call createLanguageSelector after DOM is ready and after the voice button exists
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createLanguageSelector);
  } else {
    createLanguageSelector();
  }

  // Enhanced currency patterns with more variations including Twi
  const currencyMap = {
    // English variations
      'usd': 'USD', 'dollar': 'USD', 'dollars': 'USD', 'us dollars': 'USD', 'american': 'USD', 'us': 'USD',
      'eur': 'EUR', 'euro': 'EUR', 'euros': 'EUR', 'european': 'EUR',
      'gbp': 'GBP', 'pound': 'GBP', 'pounds': 'GBP', 'sterling': 'GBP', 'british': 'GBP', 'uk': 'GBP',
      'jpy': 'JPY', 'yen': 'JPY', 'japanese': 'JPY', 'japan': 'JPY',
      'cny': 'CNY', 'yuan': 'CNY', 'rmb': 'CNY', 'chinese': 'CNY', 'china': 'CNY',
      'ghs': 'GHS', 'cedi': 'GHS', 'cedis': 'GHS', 'ghana': 'GHS', 'ghanaian': 'GHS',
      'ngn': 'NGN', 'naira': 'NGN', 'nigeria': 'NGN', 'nigerian': 'NGN',
      'zar': 'ZAR', 'rand': 'ZAR', 'south african': 'ZAR', 'african': 'ZAR',
      'inr': 'INR', 'rupee': 'INR', 'rupees': 'INR', 'indian': 'INR', 'india': 'INR',
      'aud': 'AUD', 'australian': 'AUD', 'aussie': 'AUD', 'australia': 'AUD',
    'cad': 'CAD', 'canadian': 'CAD', 'canada': 'CAD',

    // French variations
    'dollar américain': 'USD', 'dollars américains': 'USD', 'dollar': 'USD', 'dollars': 'USD',
    'euro': 'EUR', 'euros': 'EUR',
    'livre': 'GBP', 'livres': 'GBP', 'livre sterling': 'GBP',
    'yen': 'JPY', 'yens': 'JPY',
    'yuan': 'CNY', 'yuans': 'CNY',
    'cedi': 'GHS', 'cedis': 'GHS',
    'naira': 'NGN', 'nairas': 'NGN',
    'rand': 'ZAR', 'rands': 'ZAR',
    'roupie': 'INR', 'roupies': 'INR',
    'dollar australien': 'AUD', 'dollars australiens': 'AUD',
    'dollar canadien': 'CAD', 'dollars canadiens': 'CAD',

    // Spanish variations
    'dólar': 'USD', 'dólares': 'USD', 'dólar americano': 'USD', 'dólares americanos': 'USD',
    'euro': 'EUR', 'euros': 'EUR',
    'libra': 'GBP', 'libras': 'GBP', 'libra esterlina': 'GBP',
    'yen': 'JPY', 'yenes': 'JPY',
    'yuan': 'CNY', 'yuanes': 'CNY',
    'cedi': 'GHS', 'cedis': 'GHS',
    'naira': 'NGN', 'nairas': 'NGN',
    'rand': 'ZAR', 'rands': 'ZAR',
    'rupia': 'INR', 'rupias': 'INR',
    'dólar australiano': 'AUD', 'dólares australianos': 'AUD',
    'dólar canadiense': 'CAD', 'dólares canadienses': 'CAD',

    // German variations
    'dollar': 'USD', 'dollars': 'USD', 'us-dollar': 'USD', 'amerikanischer dollar': 'USD',
    'euro': 'EUR', 'euros': 'EUR',
    'pfund': 'GBP', 'pfunde': 'GBP', 'britisches pfund': 'GBP',
    'yen': 'JPY', 'japanischer yen': 'JPY',
    'yuan': 'CNY', 'chinesischer yuan': 'CNY',
    'naira': 'NGN', 'nigerianische naira': 'NGN',
    'rand': 'ZAR', 'südafrikanischer rand': 'ZAR',
    'rupie': 'INR', 'indische rupie': 'INR',
    'australischer dollar': 'AUD',
    'kanadischer dollar': 'CAD',

    // Italian variations
    'dollaro': 'USD', 'dollari': 'USD', 'dollaro americano': 'USD',
    'euro': 'EUR', 'euro': 'EUR',
    'sterlina': 'GBP', 'sterline': 'GBP', 'sterlina britannica': 'GBP',
    'yen': 'JPY', 'yen giapponese': 'JPY',
    'yuan': 'CNY', 'yuan cinese': 'CNY',
    'naira': 'NGN', 'naira nigeriana': 'NGN',
    'rand': 'ZAR', 'rand sudafricano': 'ZAR',
    'rupia': 'INR', 'rupia indiana': 'INR',
    'dollaro australiano': 'AUD',
    'dollaro canadese': 'CAD'
  };

  // Common phrases that indicate conversion intent in multiple languages
  const conversionTriggers = {
    'en-US': [
      'how much', 'what is', 'convert', 'change', 'switch', 'transform',
      'equals', 'worth', 'value', 'price', 'cost', 'rate'
    ],
    'fr-FR': [
      'combien', 'quelle est', 'convertir', 'changer', 'transformer',
      'égale', 'vaut', 'valeur', 'prix', 'coût', 'taux'
    ],
    'es-ES': [
      'cuánto', 'qué es', 'convertir', 'cambiar', 'transformar',
      'igual', 'vale', 'valor', 'precio', 'costo', 'tasa'
    ],
    'de-DE': [
      'wie viel', 'was ist', 'umrechnen', 'wechseln', 'konvertieren',
      'gleich', 'wert', 'preis', 'kosten', 'kurs'
    ],
    'it-IT': [
      'quanto', 'cosa è', 'convertire', 'cambiare', 'trasformare',
      'uguale', 'valore', 'prezzo', 'costo', 'tasso'
    ]
  };

  // Number words in multiple languages
  const numberWords = {
    'en-US': {
      'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4,
      'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9,
      'ten': 10, 'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14,
      'fifteen': 15, 'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19,
      'twenty': 20, 'thirty': 30, 'forty': 40, 'fifty': 50,
      'sixty': 60, 'seventy': 70, 'eighty': 80, 'ninety': 90,
      'hundred': 100, 'thousand': 1000, 'million': 1000000
    },
    'fr-FR': {
      'zéro': 0, 'un': 1, 'deux': 2, 'trois': 3, 'quatre': 4,
      'cinq': 5, 'six': 6, 'sept': 7, 'huit': 8, 'neuf': 9,
      'dix': 10, 'onze': 11, 'douze': 12, 'treize': 13, 'quatorze': 14,
      'quinze': 15, 'seize': 16, 'dix-sept': 17, 'dix-huit': 18, 'dix-neuf': 19,
      'vingt': 20, 'trente': 30, 'quarante': 40, 'cinquante': 50,
      'soixante': 60, 'soixante-dix': 70, 'quatre-vingt': 80, 'quatre-vingt-dix': 90,
      'cent': 100, 'mille': 1000, 'million': 1000000
    },
    'es-ES': {
      'cero': 0, 'uno': 1, 'dos': 2, 'tres': 3, 'cuatro': 4,
      'cinco': 5, 'seis': 6, 'siete': 7, 'ocho': 8, 'nueve': 9,
      'diez': 10, 'once': 11, 'doce': 12, 'trece': 13, 'catorce': 14,
      'quince': 15, 'dieciséis': 16, 'diecisiete': 17, 'dieciocho': 18, 'diecinueve': 19,
      'veinte': 20, 'treinta': 30, 'cuarenta': 40, 'cincuenta': 50,
      'sesenta': 60, 'setenta': 70, 'ochenta': 80, 'noventa': 90,
      'ciento': 100, 'mil': 1000, 'millón': 1000000
    },
    'de-DE': {
      'null': 0, 'eins': 1, 'zwei': 2, 'drei': 3, 'vier': 4,
      'fünf': 5, 'sechs': 6, 'sieben': 7, 'acht': 8, 'neun': 9,
      'zehn': 10, 'elf': 11, 'zwölf': 12, 'dreizehn': 13, 'vierzehn': 14,
      'fünfzehn': 15, 'sechzehn': 16, 'siebzehn': 17, 'achtzehn': 18, 'neunzehn': 19,
      'zwanzig': 20, 'dreißig': 30, 'vierzig': 40, 'fünfzig': 50,
      'sechzig': 60, 'siebzig': 70, 'achtzig': 80, 'neunzig': 90,
      'hundert': 100, 'tausend': 1000, 'million': 1000000
    },
    'it-IT': {
      'zero': 0, 'uno': 1, 'due': 2, 'tre': 3, 'quattro': 4,
      'cinque': 5, 'sei': 6, 'sette': 7, 'otto': 8, 'nove': 9,
      'dieci': 10, 'undici': 11, 'dodici': 12, 'tredici': 13, 'quattordici': 14,
      'quindici': 15, 'sedici': 16, 'diciassette': 17, 'diciotto': 18, 'diciannove': 19,
      'venti': 20, 'trenta': 30, 'quaranta': 40, 'cinquanta': 50,
      'sessanta': 60, 'settanta': 70, 'ottanta': 80, 'novanta': 90,
      'cento': 100, 'mille': 1000, 'milione': 1000000
    }
  };

  // Language-specific messages
  const messages = {
    'en-US': {
      listening: 'Listening... Just say an amount and currency',
      processing: 'Processing: ',
      error: 'Please say an amount (e.g., "50 dollars" or "twenty euros")',
      success: 'Converting ',
      defaultCurrency: 'Amount detected, assuming USD. Say a different currency if needed.'
    },
    'fr-FR': {
      listening: 'Écoute... Dites simplement un montant et une devise',
      processing: 'Traitement: ',
      error: 'Veuillez dire un montant (ex: "50 euros" ou "vingt dollars")',
      success: 'Conversion de ',
      defaultCurrency: 'Montant détecté, USD par défaut. Dites une autre devise si nécessaire.'
    },
    'es-ES': {
      listening: 'Escuchando... Solo diga un monto y una moneda',
      processing: 'Procesando: ',
      error: 'Por favor diga un monto (ej: "50 dólares" o "veinte euros")',
      success: 'Convirtiendo ',
      defaultCurrency: 'Monto detectado, USD por defecto. Diga otra moneda si es necesario.'
    },
    'de-DE': {
      listening: 'Höre zu... Sagen Sie einfach einen Betrag und eine Währung',
      processing: 'Verarbeite: ',
      error: 'Bitte sagen Sie einen Betrag (z.B. "50 Dollar" oder "zwanzig Euro")',
      success: 'Konvertiere ',
      defaultCurrency: 'Betrag erkannt, USD als Standard. Sagen Sie eine andere Währung, wenn nötig.'
    },
    'it-IT': {
      listening: 'In ascolto... Dite semplicemente un importo e una valuta',
      processing: 'Elaborazione: ',
      error: 'Per favore dite un importo (es. "50 dollari" o "venti euro")',
      success: 'Conversione di ',
      defaultCurrency: 'Importo rilevato, USD predefinito. Dite un\'altra valuta se necessario.'
    }
  };

  function updateInputStatus(message, type) {
      amountInput.placeholder = message;
      
      const styles = {
          listening: { color: '#4CAF50', animation: 'pulse 1.5s infinite' },
          error: { color: '#ff4444', animation: 'none' },
          processing: { color: '#2196F3', animation: 'none' },
          success: { color: '#4CAF50', animation: 'none' }
      };

      Object.assign(amountInput.style, {
          borderColor: styles[type]?.color || '',
          boxShadow: `0 0 5px ${styles[type]?.color || 'none'}`,
          animation: styles[type]?.animation || 'none'
      });

      if (timeoutId) clearTimeout(timeoutId);
      
      if (type !== 'listening') {
          timeoutId = setTimeout(() => {
              if (!isListening) {
                  amountInput.style.borderColor = '';
                  amountInput.style.boxShadow = '';
                  amountInput.style.animation = 'none';
                  amountInput.placeholder = originalPlaceholder;
              }
          }, 3000);
      }
  }

  function extractAmount(transcript) {
      // Try to find decimal numbers first
      const decimalMatch = transcript.match(/\d+\s*point\s*\d+|\d+\s*\.\s*\d+|\d+/);
      if (decimalMatch) {
          return parseFloat(decimalMatch[0].replace(/\s+/g, ''));
      }

    // Parse written numbers in the current language
      const words = transcript.toLowerCase().split(' ');
      let amount = 0;
      let tempAmount = 0;

      for (let i = 0; i < words.length; i++) {
          const word = words[i];
      if (numberWords[currentLanguage][word] !== undefined) {
        if (numberWords[currentLanguage][word] === 100) {
                  tempAmount = tempAmount === 0 ? 100 : tempAmount * 100;
        } else if (numberWords[currentLanguage][word] >= 1000) {
          tempAmount = (tempAmount === 0 ? 1 : tempAmount) * numberWords[currentLanguage][word];
                  amount += tempAmount;
                  tempAmount = 0;
              } else {
          tempAmount += numberWords[currentLanguage][word];
              }
          }
      }

      return amount + tempAmount || null;
  }

  function detectCurrencies(transcript) {
      const text = transcript.toLowerCase();
      let fromCurrency = null;
      let toCurrency = null;
      let hasConversionIntent = false;

    // Check for conversion intent in current language
    conversionTriggers[currentLanguage].forEach(trigger => {
          if (text.includes(trigger)) {
              hasConversionIntent = true;
          }
      });

      // Scan for currency mentions
      const words = text.split(' ');
      let foundCurrencies = [];

      for (let i = 0; i < words.length; i++) {
          const word = words[i];
          // Check single words and combinations (e.g., "us dollars")
          const possiblePhrases = [
              word,
              i < words.length - 1 ? `${word} ${words[i + 1]}` : '',
              i < words.length - 2 ? `${word} ${words[i + 1]} ${words[i + 2]}` : ''
          ];

          possiblePhrases.forEach(phrase => {
              if (currencyMap[phrase]) {
                  foundCurrencies.push(currencyMap[phrase]);
              }
          });
      }

      // Remove duplicates
      foundCurrencies = [...new Set(foundCurrencies)];

      // Assign currencies based on order and context
      if (foundCurrencies.length >= 2) {
          fromCurrency = foundCurrencies[0];
          toCurrency = foundCurrencies[1];
      } else if (foundCurrencies.length === 1) {
          // If only one currency is mentioned, make it the source currency
          fromCurrency = foundCurrencies[0];
          // Set USD as default target if not specified
          toCurrency = 'USD';
      }

      return { fromCurrency, toCurrency, hasConversionIntent };
  }

  // Helper: Detect if transcript matches selected language (basic check)
  function isTranscriptInSelectedLanguage(transcript) {
    // Use a few common words from each language for a basic check
    const languageHints = {
      'en-US': [/\b(the|and|dollar|how|much|convert|to|from)\b/i],
      'fr-FR': [/\b(le|et|euro|combien|convertir|à|de|devise)\b/i],
      'es-ES': [/\b(el|y|euro|cuánto|convertir|a|de|moneda)\b/i],
      'de-DE': [/\b(dollar|euro|wie|viel|umrechnen|zu|von|währung|preis|kurs)\b/i],
      'it-IT': [/\b(dollaro|euro|quanto|convertire|a|da|valuta|prezzo|tasso)\b/i]
    };
    const hints = languageHints[currentLanguage] || [];
    return hints.some(re => re.test(transcript));
  }

  function processVoiceInput(transcript) {
    // Only process if transcript matches selected language
    if (!isTranscriptInSelectedLanguage(transcript)) {
      updateInputStatus(
        `Please speak in the selected language.`,
        'error'
      );
      // Clear status after a short delay
      setTimeout(() => {
        if (window._voiceUI) {
          window._voiceUI.setStatus('Tap the mic and speak', '#3b82f6');
        }
      }, 1200);
      return;
    }
      console.log('Processing transcript:', transcript);
    updateInputStatus(messages[currentLanguage].processing + transcript, 'processing');

      const amount = extractAmount(transcript);
      const { fromCurrency, toCurrency, hasConversionIntent } = detectCurrencies(transcript);

      if (amount) {
          amountInput.value = amount;
          
          if (fromCurrency) {
              fromCurrencySelect.value = fromCurrency;
              
              if (toCurrency) {
                  toCurrencySelect.value = toCurrency;
                  updateInputStatus(
            messages[currentLanguage].success + `${amount} ${fromCurrency} to ${toCurrency}`,
                      'success'
                  );
                  
          // Highlight the current language button
          const langButtons = document.querySelectorAll('.lang-btn');
          langButtons.forEach(btn => {
            if (btn.title.includes(currentLanguage.split('-')[0])) {
              btn.style.background = 'rgba(255,255,255,0.3)';
            } else {
              btn.style.background = 'rgba(255,255,255,0.1)';
            }
          });
          
                  setTimeout(() => {
                      convertButton.click();
                      stopRecognition();
                  }, 1000);
              } else {
                  // If no target currency specified, use USD as default
                  toCurrencySelect.value = 'USD';
                  updateInputStatus(
            messages[currentLanguage].success + `${amount} ${fromCurrency} to USD`,
                      'success'
                  );
                  setTimeout(() => {
                      convertButton.click();
                      stopRecognition();
                  }, 1000);
              }
          } else {
              // If no currency specified, assume USD
              fromCurrencySelect.value = 'USD';
              updateInputStatus(
          messages[currentLanguage].defaultCurrency,
                  'processing'
              );
          }
      } else {
          updateInputStatus(
        messages[currentLanguage].error,
              'error'
          );
      }

    // Always clear status after a short delay for a fresh session
    setTimeout(() => {
      if (window._voiceUI) {
        window._voiceUI.setStatus('Tap the mic and speak', '#3b82f6');
      }
    }, 1200);
  }

  // Update recognition event handlers for new UI
  recognition.onstart = () => {
    isListening = true;
    if (window._voiceUI) {
      window._voiceUI.setStatus(messages[currentLanguage].listening, '#03dac6');
      window._voiceUI.micBtn.style.background = 'linear-gradient(135deg, #03dac6 60%, #bb86fc 100%)';
      window._voiceUI.micBtn.querySelector('.mic-anim').style.animation = 'pulse-mic 1.2s infinite';
      window._voiceUI.micBtn.style.opacity = 1;
      window._voiceUI.updateMicIcon(true);
    }
  };

  recognition.onend = () => {
    isListening = false;
    if (window._voiceUI) {
      setTimeout(() => {
        window._voiceUI.setStatus('Tap the mic and speak', '#3b82f6');
      }, 800);
      window._voiceUI.micBtn.style.background = 'linear-gradient(135deg, #bb86fc 60%, #03dac6 100%)';
      window._voiceUI.micBtn.querySelector('.mic-anim').style.animation = 'none';
      window._voiceUI.micBtn.style.opacity = 0.7;
      window._voiceUI.updateMicIcon(false);
    }
  };

  recognition.onresult = (event) => {
    const transcript = Array.from(event.results)
      .map(result => result[0].transcript.toLowerCase())
      .join(' ');

    if (window._voiceUI) {
      window._voiceUI.setStatus('Hearing: ' + transcript, '#2196F3');
    }

    if (event.results[event.results.length - 1].isFinal) {
      processVoiceInput(transcript);
    }
  };

  recognition.onerror = (event) => {
    if (window._voiceUI) {
      window._voiceUI.setStatus('Error: ' + event.error, '#cf6679');
    }
    stopRecognition();
  };

  function stopRecognition() {
    if (isListening) {
      isListening = false;
      recognition.stop();
    }
  }

  // Add modern CSS
  const style = document.createElement('style');
  style.textContent = `
    @keyframes pulse-mic {
      0% { box-shadow: 0 0 0 0 rgba(59,130,246,0.2); }
      50% { box-shadow: 0 0 0 12px rgba(59,130,246,0.1); }
      100% { box-shadow: 0 0 0 0 rgba(59,130,246,0.2); }
    }
    .mic-anim {
      animation: pulse-mic 1.2s infinite;
      display: inline-block;
    }
    .voice-btn:disabled {
      opacity: 0.7 !important;
      cursor: not-allowed !important;
    }
    .stop-btn {
      display: none;
    }
    .stop-btn:active {
      background: #b00020;
    }
    .lang-btn {
      transition: all 0.3s ease;
    }
    .lang-btn:hover {
      transform: scale(1.08);
      background: linear-gradient(90deg, #3b82f6 60%, #93c5fd 100%) !important;
      color: #ffffff !important;
    }
    .voice-ui-container {
      animation: fadeIn 0.3s ease;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @media (max-width: 700px) {
      .voice-ui-container { flex-direction: column; min-width: 0; padding: 12px 0; }
      .voice-lang-selector { flex-direction: row; justify-content: center; margin-bottom: 10px; }
      .voice-status { font-size: 1rem !important; }
      .lang-btn { font-size: 0.95rem !important; padding: 7px 12px !important; }
      .voice-btn, .stop-btn { width: 38px !important; height: 38px !important; font-size: 1rem !important; }
      .voice-ui-container > div { width: 100% !important; min-width: 0 !important; }
    }
  `;
  document.head.appendChild(style);

  // Call UI creation after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createVoiceInputUI);
  } else {
    createVoiceInputUI();
  }
}

// Add necessary CSS
const style = document.createElement('style');
style.textContent = `
  @keyframes pulse {
      0% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.1); opacity: 0.8; }
      100% { transform: scale(1); opacity: 1; }
  }
  
  .voice-btn {
      transition: all 0.3s ease;
      position: relative;
    display: inline-flex;
    align-items: center;
  }
  
  .voice-btn:hover {
      transform: scale(1.05);
  }
  
  #amount {
      transition: all 0.3s ease;
  }

  .lang-btn {
    transition: all 0.3s ease;
  }

  .lang-btn:hover {
    transform: scale(1.05);
    background: rgba(255,255,255,0.2) !important;
  }

  .language-selector {
    animation: fadeIn 0.3s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateX(-10px); }
    to { opacity: 1; transform: translateX(0); }
  }

  /* Make sure the input container can handle the new elements */
  .input-container {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }
`;
document.head.appendChild(style);