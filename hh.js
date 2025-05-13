function createVoiceInputUI() {
    // Remove any existing container
    const oldContainer = document.querySelector('.voice-ui-container');
    if (oldContainer) oldContainer.remove();
  
    // Main container with floating card design
    const container = document.createElement('div');
    container.className = 'voice-ui-container';
    container.style = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      margin: 24px auto;
      padding: 16px 24px;
      background: linear-gradient(145deg, rgba(30,35,60,0.85), rgba(50,55,90,0.9));
      border-radius: 24px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.2);
      max-width: 540px;
      min-width: 320px;
      position: relative;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.1);
      transition: all 0.3s ease;
    `;
  
    // Language header
    const headerEl = document.createElement('div');
    headerEl.className = 'voice-ui-header';
    headerEl.style = `
      font-size: 0.85rem;
      color: rgba(255,255,255,0.7);
      margin-bottom: 8px;
      font-weight: 500;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      position: absolute;
      top: -10px;
      left: 20px;
      background: rgba(40,45,70,0.9);
      padding: 2px 10px;
      border-radius: 12px;
      border: 1px solid rgba(255,255,255,0.1);
    `;
    headerEl.textContent = 'Voice Input';
    container.appendChild(headerEl);
  
    // Language selector (tabbed style)
    const langSelector = document.createElement('div');
    langSelector.className = 'language-selector';
    langSelector.style = `
      display: flex;
      gap: 6px;
      margin: 0;
      align-items: center;
      flex-wrap: wrap;
      justify-content: center;
    `;
  
    const languages = [
      { code: 'en-US', name: 'English', flag: '🇺🇸' },
      { code: 'fr-FR', name: 'French', flag: '🇫🇷' },
      { code: 'es-ES', name: 'Spanish', flag: '🇪🇸' },
      { code: 'tw-TW', name: 'Twi', flag: '🇬🇭' }
    ];
  
    languages.forEach(lang => {
      const button = document.createElement('button');
      button.className = 'lang-btn';
      button.dataset.lang = lang.code;
      button.innerHTML = `${lang.flag} <span class="lang-name">${lang.name}</span>`;
      button.title = `${lang.name}`;
      button.style = `
        padding: 8px 12px;
        border-radius: 16px;
        background: rgba(255,255,255,0.08);
        color: rgba(255,255,255,0.9);
        border: none;
        cursor: pointer;
        font-size: 0.9rem;
        display: flex;
        align-items: center;
        gap: 6px;
        justify-content: center;
        transition: all 0.3s ease;
        min-width: 32px;
        font-weight: 500;
      `;
  
      button.onclick = () => {
        // Update current language
        currentLanguage = lang.code;
        recognition.lang = lang.code;
  
        // Update button styles
        document.querySelectorAll('.lang-btn').forEach(btn => {
          btn.style.background = 'rgba(255,255,255,0.08)';
          btn.style.boxShadow = 'none';
        });
        button.style.background = 'rgba(100,120,230,0.3)';
        button.style.boxShadow = '0 0 0 1px rgba(100,120,230,0.5)';
  
        // Show microphone controls after language selection
        voiceControls.style.opacity = '1';
        voiceControls.style.pointerEvents = 'auto';
        
        if (window._voiceUI?.setStatus) {
          window._voiceUI.setStatus(`${lang.name} selected`, '#3ec6ff');
        }
  
        // Restart recognition if active
        if (isListening) {
          stopRecognition();
          setTimeout(() => startRecognition(), 300);
        }
      };
  
      langSelector.appendChild(button);
    });
  
    container.appendChild(langSelector);
  
    // Divider
    const divider = document.createElement('div');
    divider.style = `
      width: 90%;
      height: 1px;
      background: rgba(255,255,255,0.1);
      margin: 12px auto 16px auto;
    `;
    container.appendChild(divider);
  
    // Voice controls container
    const voiceControls = document.createElement('div');
    voiceControls.className = 'voice-controls';
    voiceControls.style = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      opacity: 0.6;
      pointer-events: none;
      transition: opacity 0.3s ease;
    `;
  
    // Status element
    const status = document.createElement('div');
    status.className = 'voice-status';
    status.style = `
      font-size: 1rem;
      color: #3ec6ff;
      flex: 1;
      text-align: left;
      font-weight: 500;
      transition: color 0.3s;
    `;
    status.textContent = 'Select a language to start';
    voiceControls.appendChild(status);
  
    // Controls wrapper
    const controlsWrapper = document.createElement('div');
    controlsWrapper.style = `
      display: flex;
      align-items: center;
      gap: 12px;
    `;
  
    // Microphone button
    const micBtn = document.createElement('button');
    micBtn.className = 'voice-btn';
    micBtn.style = `
      background: linear-gradient(135deg, #3ec6ff 0%, #4f8cff 100%);
      border: none;
      border-radius: 50%;
      width: 52px;
      height: 52px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 1.5rem;
      box-shadow: 0 4px 12px rgba(62,198,255,0.3);
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;
      overflow: hidden;
    `;
    
    // Add ripple effect on microphone
    const ripple = document.createElement('span');
    ripple.className = 'mic-ripple';
    ripple.style = `
      position: absolute;
      width: 100%;
      height: 100%;
      background: radial-gradient(circle, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 70%);
      border-radius: 50%;
      transform: scale(0);
      opacity: 0;
      transition: transform 0.5s ease-out, opacity 0.5s ease-out;
    `;
    micBtn.appendChild(ripple);
    
    const micIcon = document.createElement('span');
    micIcon.className = 'mic-icon';
    micIcon.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 14C13.66 14 15 12.66 15 11V5C15 3.34 13.66 2 12 2C10.34 2 9 3.34 9 5V11C9 12.66 10.34 14 12 14Z" fill="white"/><path d="M17 11C17 14.53 14.39 17.44 11 17.93V21H13C13.55 21 14 21.45 14 22C14 22.55 13.55 23 13 23H11H9C8.45 23 8 22.55 8 22C8 21.45 8.45 21 9 21H11V17.93C7.61 17.44 5 14.53 5 11H7C7 13.76 9.24 16 12 16C14.76 16 17 13.76 17 11H19C19 11.34 18.96 11.67 18.9 12" stroke="white" stroke-width="2"/></svg>';
    micBtn.appendChild(micIcon);
    
    micBtn.title = 'Start voice input';
    micBtn.onclick = function() {
      startRecognition();
      // Activate ripple effect
      ripple.style.transform = 'scale(3)';
      ripple.style.opacity = '1';
      setTimeout(() => {
        ripple.style.transform = 'scale(0)';
        ripple.style.opacity = '0';
      }, 600);
    };
    controlsWrapper.appendChild(micBtn);
  
    // Stop button
    const stopBtn = document.createElement('button');
    stopBtn.className = 'stop-btn';
    stopBtn.style = `
      display: none;
      background: linear-gradient(135deg, #ff4d6d 0%, #ff758f 100%);
      border: none; 
      border-radius: 50%;
      width: 52px;
      height: 52px;
      color: white;
      font-size: 1.5rem;
      box-shadow: 0 4px 12px rgba(255,77,109,0.3);
      cursor: pointer;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    `;
    stopBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="6" width="12" height="12" rx="2" fill="white"/></svg>';
    stopBtn.title = 'Stop listening';
    stopBtn.onclick = function() {
      stopRecognition();
    };
    controlsWrapper.appendChild(stopBtn);
  
    voiceControls.appendChild(controlsWrapper);
    container.appendChild(voiceControls);
  
    // Insert the UI into the converter div
    const converter = document.querySelector('.converter');
    if (converter) {
      const result = converter.querySelector('#result');
      if (result && result.nextSibling) {
        converter.insertBefore(container, result.nextSibling);
      } else if (result) {
        converter.appendChild(container);
      } else {
        converter.appendChild(container);
      }
    } else {
      document.body.appendChild(container);
    }
  
    // Helper function to update status
    function setStatus(text, color) {
      status.textContent = text;
      status.style.color = color || '#3ec6ff';
    }
  
    // Expose for use in recognition events
    window._voiceUI = { setStatus, stopBtn, micBtn, status };
    
    // Highlight English as default
    const englishBtn = document.querySelector('.lang-btn[data-lang="en-US"]');
    if (englishBtn) {
      englishBtn.click();
    }
  }
  
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
  
    // Create modern voice input UI
    createVoiceInputUI();
  
    // Currency patterns with variations including Twi
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
  
      // Twi variations
      'dɔla': 'USD', 'dɔla kakra': 'USD', 'amerika dɔla': 'USD',
      'yuro': 'EUR', 'yuro kakra': 'EUR',
      'pɔn': 'GBP', 'pɔn kakra': 'GBP',
      'yen': 'JPY', 'yen kakra': 'JPY',
      'yuan': 'CNY', 'yuan kakra': 'CNY',
      'sidi': 'GHS', 'sidi kakra': 'GHS', 'ghana sidi': 'GHS',
      'nayra': 'NGN', 'nayra kakra': 'NGN',
      'rand': 'ZAR', 'rand kakra': 'ZAR',
      'rupi': 'INR', 'rupi kakra': 'INR',
      'ɔstrelia dɔla': 'AUD', 'ɔstrelia dɔla kakra': 'AUD',
      'kanada dɔla': 'CAD', 'kanada dɔla kakra': 'CAD'
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
      'tw-TW': [
        'dɛn sɛn', 'ɛyɛ dɛn', 'sesa', 'sesa kɔ', 'sesa baa',
        'yɛ', 'tɔ', 'bo', 'tɔ bo', 'tɔ kɛse', 'tɔ kakra'
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
      'tw-TW': {
        'baako': 1, 'mmienu': 2, 'mmiɛnsa': 3, 'ɛnan': 4, 'enum': 5,
        'nsia': 6, 'nson': 7, 'nwɔtwe': 8, 'nkron': 9, 'du': 10,
        'dubaako': 11, 'dumienu': 12, 'dumiɛnsa': 13, 'dunɛn': 14, 'dunum': 15,
        'dunsia': 16, 'dunson': 17, 'dunwɔtwe': 18, 'dunkron': 19,
        'aduonu': 20, 'aduasa': 30, 'aduonum': 50, 'aduosia': 60,
        'aduoson': 70, 'aduowɔtwe': 80, 'aduokron': 90,
        'ɔha': 100, 'apem': 1000, 'mpem': 1000000
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
      'tw-TW': {
        listening: 'Tie asɛm... Ka sika kɛse anaa kakra a ɛwɔ hɔ',
        processing: 'Yɛreyɛ adwuma: ',
        error: 'Ka sika kɛse anaa kakra a ɛwɔ hɔ (tɛkyerɛma: "sidi enum" anaa "dɔla aduonu")',
        success: 'Yɛresesa ',
        defaultCurrency: 'Yɛahunu sika kɛse anaa kakra a ɛwɔ hɔ, yɛde USD bɛyɛ adwuma. Ka foforɔ sɛ ɛsɛ.'
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
        'tw-TW': [/\b(sidi|dɔla|yɛ|dɛn|kakra|bo|tɔ)\b/i]
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
          return false;
        }
    
        const amount = extractAmount(transcript);
        const { fromCurrency, toCurrency, hasConversionIntent } = detectCurrencies(transcript);
        
        // Update UI based on voice input
        if (window._voiceUI?.setStatus) {
          window._voiceUI.setStatus(messages[currentLanguage].processing + transcript, '#2196F3');
        }
        
        // If we've detected an amount
        if (amount !== null) {
          amountInput.value = amount;
          
          // If currencies were detected, update the dropdowns
          if (fromCurrency) {
            // Find and select the option
            const fromOptions = Array.from(fromCurrencySelect.options);
            const fromOption = fromOptions.find(opt => opt.value === fromCurrency);
            if (fromOption) {
              fromCurrencySelect.value = fromCurrency;
            }
            
            // Set status as success
            updateInputStatus(messages[currentLanguage].success + amount + ' ' + fromCurrency, 'success');
          } else {
            // No currency specified, assume USD
            updateInputStatus(messages[currentLanguage].defaultCurrency, 'success');
          }
          
          if (toCurrency) {
            // Find and select the option
            const toOptions = Array.from(toCurrencySelect.options);
            const toOption = toOptions.find(opt => opt.value === toCurrency);
            if (toOption) {
              toCurrencySelect.value = toCurrency;
            }
          }
          
          // If we have an intent to convert, trigger the conversion
          if (hasConversionIntent) {
            convertButton.click();
          }
          
          return true;
        } else {
          updateInputStatus(messages[currentLanguage].error, 'error');
          return false;
        }
      }
    
      function startRecognition() {
        if (isListening) return;
        
        // Update UI to show we're listening
        if (window._voiceUI) {
          window._voiceUI.setStatus(messages[currentLanguage].listening, '#4CAF50');
          window._voiceUI.micBtn.style.display = 'none';
          window._voiceUI.stopBtn.style.display = 'flex';
        }
        
        updateInputStatus(messages[currentLanguage].listening, 'listening');
        
        try {
          recognition.start();
          isListening = true;
        } catch (e) {
          console.error('Speech recognition error:', e);
          updateInputStatus('Error starting speech recognition', 'error');
        }
      }
    
      function stopRecognition() {
        if (!isListening) return;
        
        // Update UI to show we've stopped listening
        if (window._voiceUI) {
          window._voiceUI.micBtn.style.display = 'flex';
          window._voiceUI.stopBtn.style.display = 'none';
        }
        
        try {
          recognition.stop();
          isListening = false;
        } catch (e) {
          console.error('Error stopping speech recognition:', e);
        }
      }
    
      // Set up speech recognition event handlers
      recognition.onstart = function() {
        isListening = true;
        updateInputStatus(messages[currentLanguage].listening, 'listening');
      };
      
      recognition.onresult = function(event) {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join(' ');
        
        // Process valid input immediately
        processVoiceInput(transcript);
      };
      
      recognition.onerror = function(event) {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'no-speech') {
          if (window._voiceUI?.setStatus) {
            window._voiceUI.setStatus('No speech detected. Try again.', '#ff4444');
          }
        } else {
          if (window._voiceUI?.setStatus) {
            window._voiceUI.setStatus(`Error: ${event.error}`, '#ff4444');
          }
        }
        
        // Auto-stop on error
        stopRecognition();
      };
      
      recognition.onend = function() {
        isListening = false;
        
        // Reset UI when recognition ends
        if (window._voiceUI) {
          window._voiceUI.micBtn.style.display = 'flex';
          window._voiceUI.stopBtn.style.display = 'none';
        }
      };
    
      // Return the recognition object for external use
      return {
        recognition,
        startRecognition,
        stopRecognition,
        isListening: () => isListening,
        getCurrentLanguage: () => currentLanguage,
        setLanguage: (lang) => {
          currentLanguage = lang;
          recognition.lang = lang;
        }
      };
    }
    
    // Initialize voice recognition when the page loads
    document.addEventListener('DOMContentLoaded', function() {
      // Check for browser support
      if (window.SpeechRecognition || window.webkitSpeechRecognition) {
        const voiceController = startVoiceRecognition();
        
        // Store the controller for potential external access
        window.voiceController = voiceController;
        
        // Add keyboard shortcut (spacebar) for voice input
        document.addEventListener('keydown', function(event) {
          // Only trigger if focused on the converter and pressing spacebar
          const converter = document.querySelector('.converter');
          if (converter && converter.contains(document.activeElement) && event.code === 'Space' && event.ctrlKey) {
            event.preventDefault();
            if (!voiceController.isListening()) {
              voiceController.startRecognition();
            } else {
              voiceController.stopRecognition();
            }
          }
        });
        
        // Add info about keyboard shortcut
        const shortcutInfo = document.createElement('div');
        shortcutInfo.className = 'shortcut-info';
        shortcutInfo.style = `
          font-size: 0.75rem;
          color: rgba(255,255,255,0.6);
          text-align: center;
          margin-top: 8px;
          font-style: italic;
        `;
        shortcutInfo.textContent = 'Press Ctrl+Space for voice input';
        document.querySelector('.voice-ui-container')?.appendChild(shortcutInfo);
      } else {
        console.warn('Speech recognition not supported in this browser');
        
        // Add a warning message to the UI
        const converter = document.querySelector('.converter');
        if (converter) {
          const warningDiv = document.createElement('div');
          warningDiv.className = 'browser-warning';
          warningDiv.style = `
            padding: 10px;
            margin: 10px 0;
            background-color: rgba(255, 152, 0, 0.1);
            border-left: 4px solid #FF9800;
            color: #FF9800;
            border-radius: 4px;
          `;
          warningDiv.textContent = 'Voice recognition is not supported in your browser. Please try Chrome, Edge, or Safari.';
          converter.appendChild(warningDiv);
        }
      }
    });
    
    // Add CSS for animations
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
      @keyframes pulse {
        0% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.4); }
        70% { box-shadow: 0 0 0 10px rgba(76, 175, 80, 0); }
        100% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0); }
      }
      
      .voice-btn:hover, .stop-btn:hover {
        transform: scale(1.05);
      }
      
      .voice-btn:active, .stop-btn:active {
        transform: scale(0.95);
      }
      
      .lang-btn:hover {
        background: rgba(255,255,255,0.15) !important;
      }
    `;
    document.head.appendChild(styleSheet);
    
    // Export functions for possible module use
    if (typeof module !== 'undefined' && module.exports) {
      module.exports = {
        startVoiceRecognition,
        createVoiceInputUI
      };
    }