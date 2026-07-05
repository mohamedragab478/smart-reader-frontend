import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Loader2 } from 'lucide-react';

export default function AuthModal({ isOpen, onClose }) {
  const { login, register } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState(true);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    let result;
    if (isLoginMode) {
      result = await login(email, password);
    } else {
      result = await register(name, email, password);
    }

    setIsLoading(false);

    if (result.success) {
      onClose();
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" dir="rtl">
      <div className="bg-white dark:bg-gray-800 w-full max-w-md p-8 rounded-3xl shadow-2xl relative animate-fade-in-up mx-4 border border-gray-100 dark:border-gray-700">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
        >
          <X size={20} />
        </button>
        
        <h2 className="text-2xl font-extrabold text-gray-800 dark:text-white mb-6 text-center">
          {isLoginMode ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
        </h2>
        
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-xl mb-4 text-sm font-bold text-center border border-red-100 dark:border-red-900/50">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLoginMode && (
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">الاسم</label>
              <input 
                type="text" 
                required 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white focus:border-indigo-500 outline-none transition-all"
                placeholder="اسمك الكريم"
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">البريد الإلكتروني</label>
            <input 
              type="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white focus:border-indigo-500 outline-none transition-all text-left"
              placeholder="email@example.com"
              dir="ltr"
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">كلمة المرور</label>
            <input 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white focus:border-indigo-500 outline-none transition-all text-left"
              placeholder="••••••••"
              dir="ltr"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md flex justify-center items-center gap-2 disabled:opacity-70 mt-2"
          >
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : (isLoginMode ? 'تسجيل الدخول' : 'إنشاء حساب')}
          </button>
        </form>
        
        <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          {isLoginMode ? 'ليس لديك حساب؟ ' : 'لديك حساب بالفعل؟ '}
          <button 
            onClick={() => {
              setIsLoginMode(!isLoginMode);
              setError('');
            }}
            className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
          >
            {isLoginMode ? 'إنشاء حساب جديد' : 'تسجيل الدخول'}
          </button>
        </div>
      </div>
    </div>
  );
}
