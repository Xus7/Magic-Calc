document.addEventListener('DOMContentLoaded', () => {
    const resultDisplay = document.getElementById('result');
    const expressionDisplay = document.getElementById('expression');
    const clearButton = document.querySelector('.clear');
    const magicButton = document.getElementById('magic-menu-button');
    const keypad = document.querySelector('.keypad');

    let currentNumber = '0';
    let previousNumber = null;
    let operator = null;
    let expectingNewNumber = true; // Indica si el siguiente clic numérico debe empezar un nuevo número

    // --- Variables de la Magia ---
    let magicValue = null; // Almacena el valor inicial que queremos restar.
    let magicMode = false; // Bandera para saber si estamos en modo mágico.

    // --- Funciones de Utilidad ---

    /** Actualiza el display y maneja el tamaño de fuente para que quepa */
    const updateDisplay = () => {
        // Formatear con puntos de miles para realismo
        if (currentNumber === 'Error' || currentNumber === 'NaN') {
            resultDisplay.textContent = currentNumber;
        } else {
            const parts = currentNumber.split('.');
            const integerPart = parts[0];
            const decimalPart = parts.length > 1 ? ',' + parts[1] : '';
            
            // Usamos formato local español para los puntos en los miles
            const formattedInteger = parseInt(integerPart).toLocaleString('es-ES');
            resultDisplay.textContent = formattedInteger + decimalPart;
        }
    
        // Mostrar expresión anterior
        if (previousNumber !== null && operator !== null) {
            expressionDisplay.textContent = `${previousNumber} ${getOperatorSymbol(operator)}`;
        } else {
            expressionDisplay.textContent = '';
        }
    
        // Ajuste de fuente
        if (currentNumber.length > 10) {
            resultDisplay.style.fontSize = '3em';
        } else if (currentNumber.length > 8) {
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

    // --- Lógica de la Calculadora ---

    /** Maneja la entrada de números y el punto decimal */
    const handleNumber = (value) => {
        if (value === '.') {
            if (currentNumber.includes('.')) return;
            if (expectingNewNumber) {
                currentNumber = '0.';
                expectingNewNumber = false;
            } else {
                currentNumber += '.';
            }
        } else { // Es un dígito (0-9)
            if (expectingNewNumber) {
                currentNumber = (value === '0' && currentNumber === '0') ? '0' : value;
                expectingNewNumber = false;
            } else if (currentNumber === '0' && value !== '0') {
                currentNumber = value;
            } else if (currentNumber !== '0') {
                currentNumber += value;
            }
        }
        updateDisplay();
    };

    /** Realiza el cálculo de una operación simple */
    const calculate = (num1, op, num2) => {
        const a = parseFloat(num1);
        const b = parseFloat(num2);

        if (isNaN(a) || isNaN(b)) return 0;

        switch (op) {
            case 'add': return a + b;
            case 'subtract': return a - b;
            case 'multiply': return a * b;
            case 'divide':
                if (b === 0) return 'Error';
                return a / b;
            default: return b;
        }
    };

    /** Maneja los botones de operación (+, -, x, ÷) */
    const handleOperator = (newOperator) => {
        const inputNum = parseFloat(currentNumber);

        if (previousNumber === null) {
            // Primera operación: simplemente guarda el número
            previousNumber = currentNumber;
            operator = newOperator;
            expectingNewNumber = true;
        } else if (!expectingNewNumber) {
            // Ya hay una operación pendiente y se ha introducido un nuevo número
            const result = calculate(previousNumber, operator, currentNumber);
            if (result === 'Error') {
                resetState();
                currentNumber = 'Error';
            } else {
                // Limitar el número de decimales para no saturar el display (como las calculadoras reales)
                currentNumber = result.toString().substring(0, 15);
                previousNumber = currentNumber;
                operator = newOperator;
            }
            expectingNewNumber = true;
        } else {
            // Se cambia el operador sin introducir un nuevo número
            operator = newOperator;
        }

        updateDisplay();
    };

    /** Maneja el botón de igual (=) */
    const handleCalculate = () => {
        if (previousNumber === null && !magicMode) return;
    
        let result;
        if (magicMode) {
            const now = new Date();
            now.setMinutes(now.getMinutes() + 1); // Margen de 1 min
    
            const DD = String(now.getDate()).padStart(2, '0');
            const D = String(now.getDate());
            const MM = String(now.getMonth() + 1).padStart(2, '0');
            const M = String(now.getMonth() + 1);
            const AA = String(now.getFullYear() % 100).padStart(2, '0');
            const mm = String(now.getMinutes()).padStart(2, '0');
            
            // Lógica de hora 12h
            let hRaw = now.getHours();
            let h12 = hRaw % 12 || 12; 
            const HH = String(h12).padStart(2, '0');
            const H = String(h12);
    
            let magicDateStr = "";
    
            if (parseInt(M) < 10) {
                // Formato: ddmaahhmm (9 dígitos)
                magicDateStr = `${DD}${M}${AA}${HH}${mm}`;
            } 
            else if (parseInt(D) < 10) {
                // Formato: dmmaahhmm (9 dígitos)
                magicDateStr = `${D}${MM}${AA}${HH}${mm}`;
            } 
            else {
                // Mes >= 10 y Día >= 10
                if (h12 > 9) {
                    // Formato: ddmmhhmm (8 dígitos, eliminamos año)
                    magicDateStr = `${DD}${MM}${HH}${mm}`;
                } else {
                    // Formato: ddmmaahmm (9 dígitos, incluimos año)
                    magicDateStr = `${DD}${MM}${AA}${H}${mm}`;
                }
            }
    
            const magicDateValue = BigInt(magicDateStr);
            const storedValue = BigInt(magicValue.replace(/[.]/g, ''));
            
            result = (magicDateValue - storedValue).toString();
            expressionDisplay.textContent = ''; // Limpio para que no se vea el truco
            magicMode = false;
        } else {
            const num2 = currentNumber;
            const calcResult = calculate(previousNumber, operator, num2);
            result = calcResult.toString();
        }
        
        // Finalizar
        currentNumber = result.substring(0, 12); // Seguridad extra
        previousNumber = null;
        operator = null;
        expectingNewNumber = true;
        updateDisplay();
    };


    /** Resetea el estado de la calculadora (AC/C) */
    const resetState = () => {
        currentNumber = '0';
        previousNumber = null;
        operator = null;
        expectingNewNumber = true;
        updateDisplay();
    };

    /** Maneja las funciones (%, +/-, delete, AC/C) */
    const handleFunction = (action) => {
        let num = parseFloat(currentNumber);

        switch (action) {
            case 'clear':
                // Si es 'C', solo borra el número actual. Si es 'AC', resetea todo.
                if (currentNumber !== '0' || previousNumber !== null) {
                    currentNumber = '0';
                    if (clearButton.classList.contains('c-mode')) {
                        // Solo borra el número actual
                    } else {
                        // Borra todo (AC)
                        previousNumber = null;
                        operator = null;
                    }
                }
                break;
            case 'delete':
                if (currentNumber.length > 1 && currentNumber !== 'Error') {
                    currentNumber = currentNumber.slice(0, -1);
                } else {
                    currentNumber = '0';
                }
                break;
            case 'percent':
                if (previousNumber !== null && operator !== null && !expectingNewNumber) {
                    // Si estamos a mitad de una operación, % calcula un porcentaje del número anterior.
                    // Ej: 100 + 10% = 100 + (100 * 0.1)
                    const percentValue = parseFloat(previousNumber) * (num / 100);
                    currentNumber = percentValue.toString().substring(0, 15);
                } else {
                    // Si no hay operación pendiente, simplemente divide por 100
                    currentNumber = (num / 100).toString().substring(0, 15);
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

    // --- ✨ Lógica del Botón Mágico (Menú Superior Izquierdo) ✨ ---

    magicButton.addEventListener('click', () => {
        if (currentNumber !== '0' && currentNumber !== 'Error') {
            // 1. Guardar el valor actual (el resultado de las operaciones iniciales del espectador)
            // Se usa .replace(/[,]/g, '') para asegurar que no haya separadores de miles si los hubiéramos implementado.
            magicValue = currentNumber.toString().replace(/[.]/g, ''); 
            
            // 2. Activar el modo mágico
            magicMode = true;
            
            // 3. Resetear la calculadora (como si se pulsara AC)
            resetState();
        } else {
             // Puedes usar este botón como un simple AC si el valor es 0
             resetState();
             magicMode = false; // Asegurar que el modo mágico está desactivado
        }
    });

    // --- Escucha de Eventos Global ---

    keypad.addEventListener('click', (e) => {
        const target = e.target.closest('.btn');
        if (!target) return;

        const action = target.dataset.action;
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




