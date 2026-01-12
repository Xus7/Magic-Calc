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
        
        // Formatos de hora
        const h24Raw = now.getHours();
        const HH24 = String(h24Raw).padStart(2, '0'); // Formato 24h
        
        const h12Raw = h24Raw % 12 || 12;
        const HH12 = String(h12Raw).padStart(2, '0'); // Formato 12h con 0
        const H12 = String(h12Raw); // Formato 12h sin 0

        // REGLA: Si el mes es < 10, usamos 24h. 
        // Ejemplo: 12 (DD) + 1 (M) + 26 (AA) + 21 (HH24) + 45 (mm) = 9 dígitos.
        if (parseInt(M) < 10) {
            return `${DD}${M}${AA}${HH24}${mm}`; 
        } 
        
        // Si el mes es >= 10 (Oct, Nov, Dic), volvemos a 12h para no superar 9 dígitos
        if (parseInt(D) < 10) {
            return `${D}${MM}${AA}${HH12}${mm}`; // 9 dígitos
        }
        
        if (h12Raw > 9) {
            return `${DD}${MM}${HH12}${mm}`; // 8 dígitos (sin año)
        } else {
            return `${DD}${MM}${AA}${H12}${mm}`; // 9 dígitos
        }
    };

    const updateDisplay = () => {
        let displayText = currentNumber;
        if (currentNumber !== 'Error' && currentNumber !== 'NaN') {
            const parts = currentNumber.split('.');
            let integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, "."); 
            displayText = integerPart + (parts.length > 1 ? ',' + parts[1] : '');
        }
        resultDisplay.textContent = displayText;
        
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
            if (currentNumber.replace('.', '').length < 12) currentNumber += val;
        }
        updateDisplay();
    };

    const handleFunction = (action) => {
        let num = parseFloat(currentNumber);
        switch (action) {
            case 'delete':
                if (currentNumber.length > 1) {
                    currentNumber = currentNumber.slice(0, -1);
                    if (currentNumber === '-') currentNumber = '0';
                } else {
                    currentNumber = '0';
                }
                break;
            case 'sign':
                currentNumber = (num * -1).toString();
                break;
            case 'percent':
                currentNumber = (num / 100).toString();
                break;
            case 'clear':
                resetState(true);
                break;
        }
        updateDisplay();
    };

    // --- ✨ Lógica Mágica ---

    btnTime.addEventListener('click', () => {
        if (currentNumber === '0') return;
        magicValue = currentNumber.split('.')[0]; 
        magicModeTime = true;
        magicModeForce = false;
        resetState(false); 
        if (navigator.vibrate) navigator.vibrate(60);
    });

    btnForce.addEventListener('click', () => {
        if (currentNumber === '0') return;
        const target = getMagicDate();
        const currentClean = currentNumber.split('.')[0];
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

        if (magicModeForce && action !== 'calculate' && !btn.dataset.operator) {
            if (forcedIdx < forcedString.length) {
                handleNumber(forcedString[forcedIdx++]);
                if (forcedIdx === forcedString.length && navigator.vibrate) {
                    navigator.vibrate(200); 
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
                res = getMagicDate();
                magicModeTime = false;
            } else if (magicModeForce) {
                const n1 = parseFloat(previousNumber || 0);
                const n2 = parseFloat(currentNumber);
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
        } else if (action) {
            handleFunction(action);
        }
    });

    updateDisplay();
});
