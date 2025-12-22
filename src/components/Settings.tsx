import React, { useState, useEffect } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { css } from '@codemirror/lang-css';
import { saveCustomCss } from '../lib/rust-api';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  appVersion: string;
}

const Settings: React.FC<SettingsProps> = ({ isOpen, onClose, appVersion }) => {
  const [customCSS, setCustomCSS] = useState<string>('');
  const [useCustomCSS, setUseCustomCSS] = useState<boolean>(false);
  const [cssError, setCssError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'settings' | 'about'>('settings');

  useEffect(() => {
    // Загружаем сохраненный CSS и состояние переключателя
    const savedCSS = localStorage.getItem('customCSS') || '';
    const savedUseCustomCSS = localStorage.getItem('useCustomCSS') === 'true';

    setCustomCSS(savedCSS);
    setUseCustomCSS(savedUseCustomCSS);

    // Применяем CSS если он включен
    if (savedUseCustomCSS && savedCSS.trim() !== '') {
      applyCustomCSS(savedCSS);
    }
  }, []);

  useEffect(() => {
    if (isOpen && activeTab === 'settings') {
      // Проверяем, показывалось ли уже предупреждение
      const hasSeenWarning = localStorage.getItem('hasSeenCustomCSSWarning');
      if (!hasSeenWarning) {
        // Показываем уведомление для разработчиков при первом открытии вкладки настроек
        alert(
          'Это опция для разработчиков. Вы можете ввести свой CSS для изменения стиля приложения.'
        );
        // Сохраняем, что предупреждение уже было показано
        localStorage.setItem('hasSeenCustomCSSWarning', 'true');
      }
    }
  }, [isOpen, activeTab]);

  const validateCSS = (cssString: string): boolean => {
    if (!cssString.trim()) {
      setCssError(null);
      return true;
    }

    try {
      // Простая проверка синтаксиса CSS - проверяем, что строка может быть проанализирована как HTML
      const parser = new DOMParser();
      parser.parseFromString(`<style>${cssString}</style>`, 'text/html');

      // Если стиль содержит ошибки, браузер может удалить проблемные части
      // Но это базовая проверка - для более точной проверки потребуется CSSOM парсер
      return true;
    } catch {
      setCssError('Недопустимый CSS синтаксис');
      return false;
    }
  };

  const applyCustomCSS = (cssString: string) => {
    if (!cssString.trim()) {
      removeCustomCSS();
      return;
    }

    if (!validateCSS(cssString)) {
      return;
    }

    // Удаляем предыдущий кастомный CSS
    removeCustomCSS();

    // Создаем и добавляем новый стиль
    const styleElement = document.createElement('style');
    styleElement.id = 'custom-css';
    styleElement.textContent = cssString;

    // Добавляем в конец head, чтобы переопределить базовые стили
    document.head.appendChild(styleElement);
    setCssError(null);
  };

  const removeCustomCSS = () => {
    const existingStyle = document.getElementById('custom-css');
    if (existingStyle) {
      existingStyle.remove();
    }
  };

  const handleUseCustomCSSToggle = () => {
    const newUseCustomCSS = !useCustomCSS;
    setUseCustomCSS(newUseCustomCSS);

    if (newUseCustomCSS) {
      if (customCSS.trim() !== '') {
        applyCustomCSS(customCSS);
      }
    } else {
      removeCustomCSS();
    }

    // Сохраняем состояние в localStorage
    localStorage.setItem('useCustomCSS', String(newUseCustomCSS));
  };

  const handleCSSChange = (value: string) => {
    setCustomCSS(value);

    // Если CSS включен, применяем изменения в реальном времени, если валидно
    if (useCustomCSS) {
      if (value.trim() === '') {
        removeCustomCSS();
      } else if (validateCSS(value)) {
        applyCustomCSS(value);
      }
    }
  };

  const handleSaveCSS = async () => {
    try {
      // Сохраняем CSS в файл через Rust
      await saveCustomCss(customCSS);

      // Также сохраняем в localStorage для быстрого доступа
      localStorage.setItem('customCSS', customCSS);

      // Применяем CSS если переключатель включен
      if (useCustomCSS) {
        if (customCSS.trim() !== '') {
          if (validateCSS(customCSS)) {
            applyCustomCSS(customCSS);
            alert('CSS успешно сохранен в файл и применен!');
          } else {
            alert('CSS содержит ошибки и не может быть применен.');
          }
        } else {
          removeCustomCSS();
          alert('CSS сохранен в файл (пустое значение, стили не применяются).');
        }
      } else {
        alert('CSS сохранен в файл, но не применяется (переключатель отключен).');
      }
    } catch (error) {
      console.error('Error saving CSS to file:', error);
      // Если не удалось сохранить в файл, сохраняем только в localStorage
      localStorage.setItem('customCSS', customCSS);
      alert('Ошибка при сохранении CSS в файл. Сохранено только в браузере.');
    }
  };

  const handleResetCSS = () => {
    setCustomCSS('');
    removeCustomCSS();
    setUseCustomCSS(false);
    localStorage.removeItem('customCSS');
    localStorage.setItem('useCustomCSS', 'false');
    alert('CSS сброшен до стандартных значений.');
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Настройки</h2>
          <button className="close-btn" onClick={onClose} aria-label="Закрыть">
            &times;
          </button>
        </div>

        <div className="modal-tabs">
          <button
            className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            Настройки
          </button>
          <button
            className={`tab-btn ${activeTab === 'about' ? 'active' : ''}`}
            onClick={() => setActiveTab('about')}
          >
            О приложении
          </button>
        </div>

        <div className="modal-body">
          {activeTab === 'settings' && (
            <div className="settings-tab">
              <div className="form-group">
                <div className="toggle-group">
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={useCustomCSS}
                      onChange={handleUseCustomCSSToggle}
                      className="toggle-input"
                    />
                    <span className="toggle-slider"></span>
                    <span className="toggle-text">Использовать кастомный CSS</span>
                  </label>
                </div>

                <label htmlFor="custom-css">Пользовательский CSS:</label>

                <div className="codemirror-wrapper">
                  <CodeMirror
                    value={customCSS}
                    height="200px"
                    extensions={[css()]}
                    onChange={handleCSSChange}
                    placeholder="Введите ваш CSS здесь..."
                    theme="light"
                    basicSetup={{
                      lineNumbers: true,
                      highlightActiveLine: true,
                      autocompletion: true,
                      foldGutter: true,
                    }}
                  />
                </div>

                {cssError && <div className="css-error">Ошибка: {cssError}</div>}

                <div className="button-group">
                  <button className="btn btn-primary" onClick={handleSaveCSS}>
                    Сохранить CSS
                  </button>
                  <button className="btn btn-secondary" onClick={handleResetCSS}>
                    Сбросить
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'about' && (
            <div className="about-tab">
              <div className="about-content">
                <h3>О приложении</h3>
                <p>
                  <strong>Версия:</strong> {appVersion}
                </p>
                <p>
                  Это приложение-конвертер валют, построенное с использованием Tauri, React и Rust.
                </p>
                <p>
                  Для точных вычислений используется библиотека <code>rust_decimal</code>.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
