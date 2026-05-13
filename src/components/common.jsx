import { Loader2, RefreshCw, X } from 'lucide-react';

export const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-3xl shadow-lg p-6 ${className}`}>{children}</div>
);

const buttonFocus = 'focus:outline-none focus-visible:ring-4 focus-visible:ring-pastel-green/45';

export const BigBtn = ({ children, onClick, className = '', disabled, type = 'button', ...props }) => (
  <button
    type={type}
    disabled={disabled}
    onClick={onClick}
    {...props}
    className={`inline-flex min-h-14 items-center justify-center gap-2 px-8 py-4 text-xl font-bold rounded-3xl shadow-md transition-all duration-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 ${buttonFocus} ${className}`}
  >
    {children}
  </button>
);

const choiceStateClasses = {
  idle: 'bg-white border-pastel-beige-dark text-warm-gray hover:bg-pastel-green-light hover:border-pastel-green',
  selected: 'bg-pastel-green-light border-pastel-green text-warm-gray scale-[1.02]',
  selectedBlue: 'bg-pastel-blue border-blue-400 text-warm-gray scale-[1.02]',
  correct: 'bg-green-100 border-green-400 text-warm-gray',
  incorrect: 'bg-red-100 border-red-400 text-warm-gray',
  muted: 'bg-gray-50 border-gray-200 text-warm-gray-light',
  warning: 'bg-yellow-100 border-yellow-400 text-warm-gray',
};

export const ChoiceButton = ({
  children,
  onClick,
  className = '',
  disabled,
  state = 'idle',
  align = 'center',
  type = 'button',
  ...props
}) => (
  <button
    type={type}
    disabled={disabled}
    onClick={onClick}
    {...props}
    className={`rounded-2xl border-2 transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:active:scale-100 ${buttonFocus} ${choiceStateClasses[state] || choiceStateClasses.idle} ${align === 'left' ? 'text-left' : 'text-center'} ${className}`}
  >
    {children}
  </button>
);

export const MiniBtn = ({ children, onClick, className = '', disabled, type = 'button', ...props }) => (
  <button
    type={type}
    disabled={disabled}
    onClick={onClick}
    {...props}
    className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-3 text-lg font-bold transition-all duration-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 ${buttonFocus} ${className}`}
  >
    {children}
  </button>
);

export const Spinner = () => (
  <div className="flex flex-col items-center justify-center py-16 gap-4">
    <Loader2 className="w-12 h-12 text-pastel-green animate-spin" />
    <p className="text-xl text-warm-gray">Завантаження...</p>
  </div>
);

export const ErrorBox = ({ msg, onRetry }) => (
  <div className="flex flex-col items-center justify-center py-12 gap-4">
    <X className="w-12 h-12 text-error" />
    <p className="text-xl text-warm-gray text-center">{msg}</p>
    <BigBtn onClick={onRetry} className="bg-pastel-green text-warm-gray">
      <RefreshCw className="w-5 h-5" />
      Спробувати знову
    </BigBtn>
  </div>
);

export const TaskHeader = ({ icon, title, desc }) => (
  <div className="text-center mb-6 md:mb-8">
    <div className="text-6xl mb-3">{icon}</div>
    <h2 className="text-4xl md:text-5xl font-extrabold text-warm-gray mb-4">{title}</h2>
    <p className="text-2xl md:text-3xl font-semibold text-warm-gray-light leading-snug">{desc}</p>
  </div>
);

export const Result = ({ correct, msg }) => (
  <div className={`mt-4 p-4 rounded-2xl text-center text-xl font-bold ${correct ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
    {correct ? '✅ ' : '❌ '}
    {msg}
  </div>
);
