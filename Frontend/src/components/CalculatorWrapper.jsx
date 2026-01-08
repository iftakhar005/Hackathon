import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import './CalculatorWrapper.css';

const CalculatorWrapper = ({ onUnlock }) => {
  const { userInput, setUserInput, login } = useContext(AuthContext);
  const username = 'alice'; // Hardcoded for demo

  const handleButtonPress = (value) => {
    if (value === 'C') {
      setUserInput('');
    } else if (value === '=') {
      handleEquals();
    } else if (value === 'DEL') {
      setUserInput(userInput.slice(0, -1));
    } else {
      setUserInput(userInput + value);
    }
  };

  const handleEquals = async () => {
    // Check if input matches any PIN
    const pin = userInput;

    const result = await login(username, pin);

    if (result.action === 'UNLOCK_DASHBOARD') {
      // Open dashboard
      onUnlock(result);
    } else if (result.action === 'WIPE_DATA') {
      // Show duress message
      alert('⚠️ DURESS MODE: Data wiped. Device appears normal.');
      setUserInput('');
      // Redirect to fake calculator display
    } else {
      // Fake PIN: show calculator error
      try {
        const calc = eval(userInput);
        setUserInput(calc.toString());
      } catch {
        setUserInput('Error');
      }
    }
  };

  return (
    <div className="calculator-wrapper">
      <div className="calculator-body">
        <div className="display">{userInput || '0'}</div>

        <div className="buttons">
          <button onClick={() => handleButtonPress('C')} className="btn-clear">
            C
          </button>
          <button onClick={() => handleButtonPress('DEL')} className="btn-del">
            DEL
          </button>
          <button onClick={() => handleButtonPress('/')} className="btn-op">
            ÷
          </button>
          <button onClick={() => handleButtonPress('*')} className="btn-op">
            ×
          </button>

          <button onClick={() => handleButtonPress('7')}>7</button>
          <button onClick={() => handleButtonPress('8')}>8</button>
          <button onClick={() => handleButtonPress('9')}>9</button>
          <button onClick={() => handleButtonPress('-')} className="btn-op">
            −
          </button>

          <button onClick={() => handleButtonPress('4')}>4</button>
          <button onClick={() => handleButtonPress('5')}>5</button>
          <button onClick={() => handleButtonPress('6')}>6</button>
          <button onClick={() => handleButtonPress('+')} className="btn-op">
            +
          </button>

          <button onClick={() => handleButtonPress('1')}>1</button>
          <button onClick={() => handleButtonPress('2')}>2</button>
          <button onClick={() => handleButtonPress('3')}>3</button>
          <button onClick={() => handleButtonPress('.')} className="btn-op">
            .
          </button>

          <button onClick={() => handleButtonPress('0')} className="btn-zero">
            0
          </button>
          <button onClick={handleEquals} className="btn-equals">
            =
          </button>
        </div>
      </div>
    </div>
  );
};

export default CalculatorWrapper;
