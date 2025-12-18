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
        // Formateo simple (sin comas de miles para mantenerlo simple y nativo)
        resultDisplay.textContent = currentNumber;

        // Mostrar la expresión anterior si estamos en medio de una operación
        if (previousNumber !== null && operator !== null) {
            expressionDisplay.textContent = `${previousNumber} ${getOperatorSymbol(operator)}`;
        } else {
            expressionDisplay.textContent = '';
        }

        // Ajuste de tamaño de fuente
        if (currentNumber.length > 10) {
            resultDisplay.style.fontSize = '3em';
        } else if (currentNumber.length > 8) {
            resultDisplay.style.fontSize = '4em';
        } else {
            resultDisplay.style.fontSize = '5em';
        }

        // Manejar el cambio de AC a C
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
        if (previousNumber === null) return; // Nada que calcular

        let result;
        if (magicMode) {
            // --- ✨ Lógica Mágica del Botón Igual ✨ ---
            
            // 1. Obtener la fecha y hora actual
            const now = new Date();
            
            // 2. Sumar 2 minutos
            now.setMinutes(now.getMinutes() + 2);
            
            // 3. Formatear la fecha como ddmmaaaahhmm
            const d = String(now.getDate()).padStart(2, '0');
            const m = String(now.getMonth() + 1).padStart(2, '0'); // Mínimo 0 es Enero
            const a = now.getFullYear() % 100;
            const h = String(now.getHours()).padStart(2, '0');
            const min = String(now.getMinutes()).padStart(2, '0');
            
            const magicDateStr = `${d}${m}${a}${h}${min}`;
            const magicDateValue = BigInt(magicDateStr);

            // Convertir el valor guardado a BigInt (para manejar números grandes)
            const storedValue = BigInt(magicValue.replace(/[.]/g, '')); // Quitar el punto decimal para el formato
            
            // 4. Restar el valor guardado y obtener el resultado
            const difference = magicDateValue - storedValue;
            
            result = difference.toString();
            
            // Mostrar la expresión mágica (opcional, para depuración o si quieres mostrar algo)
            expressionDisplay.textContent = `[${magicDateStr} - ${magicValue.replace(/[.]/g, '')}]`;
            
            // Salir del modo mágico
            magicMode = false;
        } else {
            // --- Lógica Normal de la Calculadora ---
            const num2 = expectingNewNumber ? currentNumber : currentNumber;
            result = calculate(previousNumber, operator, num2);
            
            // Almacenar el último número introducido como el operando 'repetido'
            if (!expectingNewNumber) {
                previousNumber = currentNumber; // Guarda el resultado como el primer operando
            }
        }
        
        // Finalizar el cálculo
        if (result === 'Error') {
            resetState();
            currentNumber = 'Error';
        } else {
            currentNumber = result.toString().substring(0, 15);
            previousNumber = null;
            operator = null;
            expectingNewNumber = true;
        }

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


