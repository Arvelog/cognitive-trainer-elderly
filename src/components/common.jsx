import { Loader2, RefreshCw, X } from 'lucide-react';

export const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-3xl shadow-lg p-6 ${className}`}>{children}</div>
);

export const BigBtn = ({ children, onClick, className = '', disabled }) => (
  <button
    disabled={disabled}
    onClick={onClick}
    className={`px-8 py-4 text-xl font-bold rounded-3xl shadow-md transition-all duration-200 active:scale-95 disabled:opacity-50 ${className}`}
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
      <RefreshCw className="inline w-5 h-5 mr-2" />
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
