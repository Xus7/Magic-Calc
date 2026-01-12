document.addEventListener('DOMContentLoaded', () => {
    const resultDisplay = document.getElementById('result');
    const expressionDisplay = document.getElementById('expression');
    const clearButton = document.querySelector('.clear');
    const keypad = document.querySelector('.keypad');
    
    // Botones Mágicos
    const magicButtonTime = document.getElementById('magic-menu-button'); // El original (izquierda)
    const magicButtonForce = document.getElementById('magic-force-button'); // El nuevo (derecha)

    let currentNumber = '0';
    let previousNumber = null;
    let operator = null;
    let expectingNewNumber = true;

    // --- Variables de la Magia ---
    let magicValue = null; // Para el modo 1 (Time Force)
    let magicModeTime = false; // Modo 1 activo

    // Para el modo 2 (Input Force)
    let magicModeForce = false; // Modo 2 activo
    let forcedTargetString = ''; // El número completo que queremos que "escriba" el espectador
    let currentForcedIndex = 0; // En qué dígito vamos

    // --- Funciones de Utilidad ---

    /** Actualiza el display con separadores de miles y ajusta el tamaño */
    const updateDisplay = () => {
        // Formatear con puntos de miles para realismo
        let displayText = currentNumber;
        if (currentNumber !== 'Error' && currentNumber !== 'NaN' && !currentNumber.includes('e')) {
            const parts = currentNumber.split('.');
            // Aseguramos que solo formateamos si parece un número válido
            if (parts[0] !== '' && !isNaN(parts[0])) {
                 const integerPart = parts[0];
                 const decimalPart = parts.length > 1 ? '.' + parts[1] : '';
                 // Usamos formato local español para los puntos en los miles
                 displayText = parseInt(integerPart).toLocaleString('es-ES').replace(/,/g, '.') + decimalPart;
            }
        }
        resultDisplay.textContent = displayText;

        // Mostrar expresión anterior
        if (previousNumber !== null && operator !== null) {
            expressionDisplay.textContent = `${previousNumber} ${getOperatorSymbol(operator)}`;
        } else {
            expressionDisplay.textContent = '';
        }

        // Ajuste de fuente dinámico
        const len = displayText.length;
        if (len > 11) {
            resultDisplay.style.fontSize = '3em';
        } else if (len > 9) {
            resultDisplay.style.fontSize = '4em';
        } else {
            resultDisplay.style.fontSize = '5em';
        }

        // Botón AC/C
        if (currentNumber !== '0' || expressionDisplay.textContent !== '') {
            clearButton.textContent = 'C';
            clearButton.classList.add('c-mode');
        } else {
            clearButton.textContent = 'AC';
            clearButton.classList.remove('c-mode');
        }
    };

    /** Convierte el nombre del operador a su símbolo */
    const getOperatorSymbol = (op) => {
        switch (op) {
            case 'add': return '+';
            case 'subtract': return '-';
            case 'multiply': return '×';
            case 'divide': return '÷';
            default: return '';
        }
    };

    /** Función Principal: Calcula la cadena de Fecha Mágica según las reglas (Max 9 dígitos) */
    const getMagicDateString = () => {
        const now = new Date();
        now.setMinutes(now.getMinutes() + 1); // Margen de 1 min

        const DD = String(now.getDate()).padStart(2, '0');
        const D = String(now.getDate());
        const MM = String(now.getMonth() + 1).padStart(2, '0');
        const M = String(now.getMonth() + 1);
        const AA = String(now.getFullYear() % 100).padStart(2, '0');
        const mm = String(now.getMinutes()).padStart(2, '0');
        
        // Lógica de hora 12h para reducir dígitos si es necesario
        let hRaw = now.getHours();
        let h12 = hRaw % 12 || 12; 
        const HH = String(h12).padStart(2, '0');
        const H = String(h12);

        let magicStr = "";

        if (parseInt(M) < 10) {
            // Mes < 10. Formato: ddmaahhmm (9 dígitos)
            magicStr = `${DD}${M}${AA}${HH}${mm}`;
        } 
        else if (parseInt(D) < 10) {
            // Mes >= 10, Día < 10. Formato: dmmaahhmm (9 dígitos)
            magicStr = `${D}${MM}${AA}${HH}${mm}`;
        } 
        else {
            // Mes >= 10 y Día >= 10
            if (h12 > 9) {
                // Hora > 9. Formato: ddmmhhmm (8 dígitos, eliminamos año)
                magicStr = `${DD}${MM}${HH}${mm}`;
            } else {
                // Hora <= 9. Formato: ddmmaahmm (9 dígitos, incluimos año)
                magicStr = `${DD}${MM}${AA}${H}${mm}`;
            }
        }
        return magicStr;
    }

    // --- Lógica de la Calculadora Normal ---

    const handleNumber = (value) => {
        if (value === '.') {
            if (currentNumber.includes('.')) return;
            if (expectingNewNumber) {
                currentNumber = '0.';
                expectingNewNumber = false;
            } else {
                currentNumber += '.';
            }
        } else {
            if (expectingNewNumber) {
                currentNumber = (value === '0' && currentNumber === '0') ? '0' : value;
                expectingNewNumber = false;
            } else if (currentNumber === '0' && value !== '0') {
                currentNumber = value;
            } else if (currentNumber.replace('.', '').length < 12) { // Límite de entrada normal
                currentNumber += value;
            }
        }
        updateDisplay();
    };

    const calculate = (num1, op, num2) => {
        const a = parseFloat(num1);
        const b = parseFloat(num2);
        if (isNaN(a) || isNaN(b)) return 0;
        switch (op) {
            case 'add': return a + b;
            case 'subtract': return a - b;
            case 'multiply': return a * b;
            case 'divide': return b === 0 ? 'Error' : a / b;
            default: return b;
        }
    };

    const handleOperator = (newOperator) => {
        if (currentNumber === 'Error') resetState();
        
        if (previousNumber === null) {
            previousNumber = currentNumber;
            operator = newOperator;
            expectingNewNumber = true;
        } else if (!expectingNewNumber) {
            const result = calculate(previousNumber, operator, currentNumber);
            currentNumber = result.toString();
            previousNumber = currentNumber;
            operator = newOperator;
            expectingNewNumber = true;
        } else {
            operator = newOperator;
        }
        updateDisplay();
    };

    const handleCalculate = () => {
        if (previousNumber === null && !magicModeTime) return;

        let result;
        
        // --- MODO 1: TIME FORCE (Botón Izquierdo) ---
        if (magicModeTime) {
            const magicDateStr = getMagicDateString();
            const magicDateValue = BigInt(magicDateStr);
            const storedValue = BigInt(magicValue.replace(/[.]/g, ''));
            
            // El resultado es la resta para que coincida con la fecha
            result = (magicDateValue - storedValue).toString();
            magicModeTime = false; // Desactivar modo
        } 
        // --- MODO NORMAL ---
        else {
            const num2 = currentNumber;
            const calcResult = calculate(previousNumber, operator, num2);
            result = calcResult.toString();
        }
        
        // Finalizar cálculo (común para ambos modos)
        currentNumber = result;
        previousNumber = null;
        operator = null;
        expectingNewNumber = true;
        
        // Resetear también el modo forzado si se pulsó igual
        magicModeForce = false;
        forcedTargetString = '';
        currentForcedIndex = 0;

        updateDisplay();
    };


    const resetState = () => {
        currentNumber = '0';
        previousNumber = null;
        operator = null;
        expectingNewNumber = true;
        magicModeTime = false;
        magicModeForce = false;
        updateDisplay();
    };

    const handleFunction = (action) => {
        let num = parseFloat(currentNumber);
        switch (action) {
            case 'clear':
                if (currentNumber !== '0' || previousNumber !== null) {
                    currentNumber = '0';
                    if (!clearButton.classList.contains('c-mode')) {
                        previousNumber = null;
                        operator = null;
                        // Si se hace AC, reseteamos modos mágicos por seguridad
                        magicModeTime = false; 
                        magicModeForce = false;
                    }
                }
                break;
            case 'delete':
                if (currentNumber.length > 1 && currentNumber !== 'Error') {
                    currentNumber = currentNumber.slice(0, -1);
                    if (currentNumber === '-') currentNumber = '0';
                } else {
                    currentNumber = '0';
                }
                break;
            case 'percent':
                if (previousNumber !== null && operator !== null && !expectingNewNumber) {
                    currentNumber = (parseFloat(previousNumber) * (num / 100)).toString();
                } else {
                    currentNumber = (num / 100).toString();
                }
                expectingNewNumber = false;
                break;
            case 'sign':
                num *= -1;
                currentNumber = num.toString();
                break;
        }
        updateDisplay();
    };

    // --- ✨ Lógica de los Botones Mágicos ✨ ---

    // MODO 1: TIME FORCE (Izquierda) - Guarda valor, limpia pantalla, el resultado final será la fecha.
    magicButtonTime.addEventListener('click', () => {
        if (currentNumber !== '0' && currentNumber !== 'Error') {
            magicValue = currentNumber.toString().replace(/[.]/g, ''); 
            magicModeTime = true;
            magicModeForce = false; // Asegurar que el otro modo no interfiere
            resetState(); // Limpia la pantalla como si fuera AC
            // Opcional: Vibración corta para confirmar activación
            if (navigator.vibrate) navigator.vibrate(50); 
        }
    });

    // MODO 2: INPUT FORCE (Derecha) - Guarda valor, NO limpia pantalla. El espectador "genera" el número.
    magicButtonForce.addEventListener('click', () => {
        if (currentNumber !== '0' && currentNumber !== 'Error') {
             // 1. Calcular la fecha objetivo final
             const finalTargetDateStr = getMagicDateString();
             const finalTargetDateBigInt = BigInt(finalTargetDateStr);

             // 2. Obtener el número actual en pantalla
             const currentScreenValueBigInt = BigInt(currentNumber.replace(/[.]/g, ''));

             // 3. Calcular el número que necesitamos que el espectador "escriba" (La diferencia)
             // Si tenemos 'A' en pantalla y queremos llegar a 'T' (Target), necesitamos generar 'B' tal que A + B = T.
             // Por tanto, B = T - A.
             const neededDifferenceBigInt = finalTargetDateBigInt - currentScreenValueBigInt;
             
             // Guardamos este número como string para ir sacándolo dígito a dígito
             forcedTargetString = neededDifferenceBigInt.toString();

             // 4. Activar variables de estado
             magicModeForce = true;
             magicModeTime = false; // Asegurar que el otro modo no interfiere
             currentForcedIndex = 0; // Reiniciar índice

             // No reseteamos el estado visual (resetState), el número actual se mantiene visible.
             // Opcional: Vibración corta para confirmar activación
             if (navigator.vibrate) navigator.vibrate(50); 
        }
    });

    // --- Escucha de Eventos Global del Teclado ---

    keypad.addEventListener('click', (e) => {
        const target = e.target.closest('.btn');
        if (!target) return;

        const action = target.dataset.action;

        // --- INTERCEPCIÓN MÁGICA (MODO 2) ---
        // Si el modo 2 está activo, y no se ha pulsado '=', interceptamos CUALQUIER clic en el teclado numérico
        if (magicModeForce && action !== 'calculate') {
            
            // Si ya hemos completado el número, no hacemos nada más hasta que den a igual
            if (currentForcedIndex >= forcedTargetString.length) {
                return; 
            }
            
            // Extraer el siguiente dígito que necesitamos forzar
            const nextForcedDigit = forcedTargetString[currentForcedIndex];
            
            // Simular que se ha pulsado ese dígito
            handleNumber(nextForcedDigit);
            
            // Avanzar índice
            currentForcedIndex++;

            // Comprobar finalización
            if (currentForcedIndex === forcedTargetString.length) {
                // Vibrar para indicar al mago que el número está completo
                if (navigator.vibrate) {
                    navigator.vibrate(200); // Vibración más larga y notable
                }
            }
            // Importante: Detenemos aquí para que no se ejecute la lógica normal del botón pulsado
            return; 
        }
        // ------------------------------------


        // Lógica normal si no estamos en modo mágico de intercepción
        const value = target.dataset.value;
        const operatorName = target.dataset.operator;

        if (value) {
            handleNumber(value);
        } else if (action) {
            if (action === 'calculate') {
                handleCalculate();
            } else {
                handleFunction(action);
            }
        } else if (operatorName) {
            handleOperator(operatorName);
        }
    });

    // Inicializar el display al cargar
    updateDisplay();

});
