document.addEventListener('DOMContentLoaded', () => {
    const resultDisplay = document.getElementById('result');
    const expressionDisplay = document.getElementById('expression');
    const clearButton = document.querySelector('.clear');
    const keypad = document.querySelector('.keypad');
    
    const btnTime = document.getElementById('magic-time-btn'); 
    const btnForce = document.getElementById('magic-force-btn');

    let currentNumber = '0';
    let previousNumber = null;
    let operator = null;
    let expectingNewNumber = true;

    // Estados Mágicos
    let magicValue = null; 
    let magicModeTime = false; 
    let magicModeForce = false;
    let forcedString = '';
    let forcedIdx = 0;

    /** Lógica de Fecha (Máximo 9 dígitos) */
    const getMagicDate = () => {
        const now = new Date();
        now.setMinutes(now.getMinutes() + 1);
        const DD = String(now.getDate()).padStart(2, '0');
        const D = String(now.getDate());
        const MM = String(now.getMonth() + 1).padStart(2, '0');
        const M = String(now.getMonth() + 1);
        const AA = String(now.getFullYear() % 100).padStart(2, '0');
        const mm = String(now.getMinutes()).padStart(2, '0');
        let h12 = now.getHours() % 12 || 12; 
        const HH = String(h12).padStart(2, '0');
        const H = String(h12);

        if (parseInt(M) < 10) return `${DD}${M}${AA}${HH}${mm}`; 
        if (parseInt(D) < 10) return `${D}${MM}${AA}${HH}${mm}`; 
        return h12 > 9 ? `${DD}${MM}${HH}${mm}` : `${DD}${MM}${AA}${H}${mm}`;
    };

    const updateDisplay = () => {
        let displayText = currentNumber;
        if (currentNumber !== 'Error' && currentNumber !== 'NaN') {
            const parts = currentNumber.split('.');
            // Formatear parte entera con puntos de miles
            let integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, "."); 
            displayText = integerPart + (parts.length > 1 ? ',' + parts[1] : '');
        }
        resultDisplay.textContent = displayText;
        
        // Expresión superior
        if (previousNumber !== null && operator !== null) {
            const opSym = {add:'+', subtract:'-', multiply:'×', divide:'÷'}[operator];
            expressionDisplay.textContent = `${previousNumber.replace('.', ',')} ${opSym}`;
        } else {
            expressionDisplay.textContent = '';
        }

        resultDisplay.style.fontSize = displayText.length > 10 ? '3.5em' : '5em';
        clearButton.textContent = (currentNumber !== '0' || previousNumber !== null) ? 'C' : 'AC';
    };

    const resetState = (hardReset = false) => {
        currentNumber = '0';
        previousNumber = null;
        operator = null;
        expectingNewNumber = true;
        if (hardReset) {
            magicModeTime = false;
            magicModeForce = false;
        }
        updateDisplay();
    };

    const handleNumber = (val) => {
        if (expectingNewNumber) {
            currentNumber = val === '.' ? '0.' : val;
            expectingNewNumber = false;
        } else {
            if (val === '.' && currentNumber.includes('.')) return;
            if (currentNumber.length < 12) currentNumber += val;
        }
        updateDisplay();
    };

    // --- ✨ Lógica Mágica ---

    // MODO 1: Izquierda (Time Force)
    btnTime.addEventListener('click', () => {
        magicValue = currentNumber.split('.')[0]; // Solo parte entera para evitar errores BigInt
        magicModeTime = true;
        magicModeForce = false;
        resetState(false); 
        if (navigator.vibrate) navigator.vibrate(60);
    });

    // MODO 2: Derecha (Input Force)
    btnForce.addEventListener('click', () => {
        const target = getMagicDate();
        const currentClean = currentNumber.split('.')[0];
        // Calculamos cuánto falta para llegar a la fecha
        let diff = BigInt(target) - BigInt(currentClean);
        forcedString = diff.toString();
        forcedIdx = 0;
        magicModeForce = true;
        magicModeTime = false;
        if (navigator.vibrate) navigator.vibrate(60);
    });

    keypad.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn');
        if (!btn) return;
        const action = btn.dataset.action;

        // INTERCEPCIÓN MODO 2 (Forzar números)
        if (magicModeForce && action !== 'calculate' && !btn.dataset.operator) {
            if (forcedIdx < forcedString.length) {
                handleNumber(forcedString[forcedIdx++]);
                if (forcedIdx === forcedString.length && navigator.vibrate) {
                    navigator.vibrate(200); // Vibración final
                }
            }
            return;
        }

        if (btn.dataset.value) handleNumber(btn.dataset.value);
        else if (btn.dataset.operator) {
            previousNumber = currentNumber;
            operator = btn.dataset.operator;
            expectingNewNumber = true;
            updateDisplay();
        } else if (action === 'calculate') {
            let res;
            if (magicModeTime) {
                // En modo 1, el resultado es directamente la fecha
                res = getMagicDate();
                magicModeTime = false;
            } else if (magicModeForce) {
                // En modo 2, la suma ya dará la fecha porque forzamos la diferencia
                const n1 = parseFloat(previousNumber), n2 = parseFloat(currentNumber);
                res = (n1 + n2).toString();
                magicModeForce = false;
            } else {
                const n1 = parseFloat(previousNumber), n2 = parseFloat(currentNumber);
                if (operator === 'add') res = n1 + n2;
                else if (operator === 'subtract') res = n1 - n2;
                else if (operator === 'multiply') res = n1 * n2;
                else if (operator === 'divide') res = n2 === 0 ? 'Error' : n1 / n2;
                else res = currentNumber;
            }
            currentNumber = res.toString();
            previousNumber = null; operator = null; expectingNewNumber = true;
            updateDisplay();
        } else if (action === 'clear') resetState(true);
    });

    updateDisplay();
});
