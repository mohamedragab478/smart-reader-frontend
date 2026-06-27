import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import { 
  Search, BookOpen, FileText, MessageSquare, ArrowRight, User, 
  ThumbsUp, ThumbsDown, Minus, Loader2, Send, AlertCircle, 
  Headphones, StopCircle, PauseCircle, PlayCircle, Moon, Sun, Globe,
  ExternalLink, X, Upload, FilePlus
} from 'lucide-react';

export default function ArticleHub() {
  // --- State Management ---
  const [articles, setArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedArticle, setSelectedArticle] = useState(null);

  // Feature States
  const [showSummary, setShowSummary] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryError, setSummaryError] = useState(null);

  // Comment States
  const [newComment, setNewComment] = useState("");
  const [isPostingComment, setIsPostingComment] = useState(false);

  // --- Scraper States ---
  const [scrapeUrl, setScrapeUrl] = useState("");
  const [isScraping, setIsScraping] = useState(false);

  // --- File Upload States ---
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

  // --- Web Search States ---
  const [webSearchQuery, setWebSearchQuery] = useState("");
  const [webSearchResults, setWebSearchResults] = useState([]);
  const [isWebSearching, setIsWebSearching] = useState(false);
  const [activeTab, setActiveTab] = useState('library'); // 'library' | 'search'

  // --- Chatbot States ---
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  // --- TTS States ---
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const speechUtteranceRef = useRef(null);
  const { isDarkMode, toggleTheme } = useTheme();

  // --- Env Vars ---
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:7860/api/v1';
  const DEFAULT_IMAGE_URL = import.meta.env.VITE_DEFAULT_IMAGE_URL || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=60';

  // --- Functions ---
  useEffect(() => {
    fetchArticles();
  }, []);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory]);

  const fetchArticles = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/articles`);
      if (!response.ok) {
        throw new Error('فشل الاتصال بالسيرفر. تأكد أن Spring Boot/FastAPI يعمل.');
      }
      const data = await response.json();
      setArticles(data);
    } catch (err) {
      console.error("Error fetching articles:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Handlers ---

  const handleFileUpload = async (file) => {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['pdf', 'docx', 'txt'].includes(ext)) {
      setUploadError('نوع الملف غير مدعوم. يرجى رفع ملف PDF أو Word (docx) أو نص (txt)');
      return;
    }
    setIsUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_BASE_URL}/articles/upload`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'فشل رفع الملف');
      }
      const newArticle = await res.json();
      setArticles(prev => [newArticle, ...prev]);
      setSelectedArticle(newArticle);
      setActiveTab('library');
    } catch (err) {
      setUploadError(err.message || 'حدث خطأ أثناء رفع الملف');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleWebSearch = async () => {
    if (!webSearchQuery.trim()) return;
    setIsWebSearching(true);
    setWebSearchResults([]);
    try {
      const res = await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(webSearchQuery)}&max_results=9`);
      if (!res.ok) throw new Error('فشل البحث');
      const data = await res.json();
      setWebSearchResults(data);
    } catch (err) {
      alert(err.message || 'حدث خطأ أثناء البحث');
    } finally {
      setIsWebSearching(false);
    }
  };

  const handleScrapeFromSearch = async (url) => {
    setIsScraping(true);
    setActiveTab('library');
    try {
      const res = await fetch(`${API_BASE_URL}/articles/scrape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      if (!res.ok) throw new Error('فشل جلب المقال من الرابط.');
      const newArticle = await res.json();
      setArticles(prev => [newArticle, ...prev]);
      setSelectedArticle(newArticle);
      setChatHistory([]);
    } catch (err) {
      alert(err.message || 'حدث خطأ أثناء جلب المقال.');
    } finally {
      setIsScraping(false);
    }
  };

  const handleScrape = async () => {
    if (!scrapeUrl.trim()) return;
    setIsScraping(true);
    try {
      const res = await fetch(`${API_BASE_URL}/articles/scrape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: scrapeUrl })
      });

      if (!res.ok) {
        throw new Error('فشل جلب المقال من الرابط المحدد.');
      }

      const newArticle = await res.json();
      setArticles(prev => [newArticle, ...prev]);
      setSelectedArticle(newArticle);
      setScrapeUrl("");
      setChatHistory([]); // Clear chat history for new article
    } catch (err) {
      alert(err.message || 'حدث خطأ أثناء جلب المقال.');
    } finally {
      setIsScraping(false);
    }
  };

  const handleSendChatMessage = async () => {
    if (!chatInput.trim() || !selectedArticle?.id) return;
    
    const userMessage = chatInput;
    setChatInput("");
    setChatHistory(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsChatLoading(true);

    try {
      const payload = {
        message: userMessage,
        history: chatHistory
      };

      const res = await fetch(`${API_BASE_URL}/ai/articles/${selectedArticle.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error('تعذر الحصول على رد من المساعد الذكي');
      }

      const data = await res.json();
      setChatHistory(prev => [...prev, { role: 'model', content: data.reply }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'model', content: `خطأ: ${err.message}` }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleSummarize = async () => {
    if (showSummary) {
      setShowSummary(false);
      return;
    }

    if (!selectedArticle?.id) return;

    setIsSummarizing(true);
    setSummaryError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/ai/articles/${selectedArticle.id}/summary`);
      if (!res.ok) {
        throw new Error('فشل جلب الملخص من الخادم');
      }

      const summaryText = await res.text();
      const updatedArticle = { ...selectedArticle, summary: summaryText };
      setSelectedArticle(updatedArticle);
      setArticles(prev => prev.map(a => a.id === updatedArticle.id ? updatedArticle : a));
      setShowSummary(true);
    } catch (err) {
      console.error('Error fetching summary:', err);
      setSummaryError(err.message || 'حدث خطأ أثناء جلب الملخص');
    } finally {
      setIsSummarizing(false);
    }
  };

  const handlePostComment = async () => {
    if (!newComment.trim()) return;

    setIsPostingComment(true);

    try {
      const payload = {
        text: newComment,
        user: { id: 1 },
        article: { id: selectedArticle.id }
      };

      const response = await fetch(`${API_BASE_URL}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const savedComment = await response.json();
        const updatedArticle = {
          ...selectedArticle,
          comments: [...(selectedArticle.comments || []), savedComment]
        };

        setSelectedArticle(updatedArticle);
        setArticles(prev => prev.map(a => a.id === selectedArticle.id ? updatedArticle : a));
        setNewComment("");
      } else {
        alert("فشل في حفظ التعليق");
      }
    } catch (error) {
      console.error("Error posting comment:", error);
      alert("حدث خطأ أثناء الاتصال بالسيرفر");
    } finally {
      setIsPostingComment(false);
    }
  };

  const goBack = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
    setShowSummary(false);
    setSelectedArticle(null);
    setNewComment("");
    setChatHistory([]);
  };

  // --- TTS Handlers ---
  const handleSpeak = () => {
    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsSpeaking(true);
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      return;
    }

    if (!selectedArticle?.content) return;

    window.speechSynthesis.cancel();

    const textToSpeak = showSummary && selectedArticle.summary ? selectedArticle.summary : selectedArticle.content;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);

    // Simple language detection (checks if text contains Arabic characters)
    const isArabic = /[\u0600-\u06FF]/.test(textToSpeak);
    const voices = window.speechSynthesis.getVoices();
    
    if (isArabic) {
      const arabicVoice = voices.find(v => v.lang.includes('ar'));
      if (arabicVoice) utterance.voice = arabicVoice;
      utterance.lang = 'ar-SA';
    } else {
      const englishVoice = voices.find(v => v.lang.includes('en'));
      if (englishVoice) utterance.voice = englishVoice;
      utterance.lang = 'en-US';
    }
    
    utterance.rate = 1.0;

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    utterance.onerror = (e) => {
      console.error("TTS Error:", e);
      setIsSpeaking(false);
      setIsPaused(false);
    };

    speechUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
    setIsPaused(false);
  };

  const handleStopSpeak = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
  };

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const getSentimentStyle = (sentiment) => {
    const s = sentiment ? String(sentiment).toUpperCase() : 'NEUTRAL';
    if (s === 'POSITIVE') return 'bg-green-50 text-green-700 ring-1 ring-green-200 dark:bg-green-950/40 dark:text-green-300 dark:ring-green-900';
    if (s === 'NEGATIVE') return 'bg-red-50 text-red-700 ring-1 ring-red-200 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-900';
    return 'bg-gray-100 text-gray-600 ring-1 ring-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700';
  };

  const filteredArticles = articles.filter(article =>
    article.title?.includes(searchTerm) || article.category?.includes(searchTerm)
  );

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans text-right transition-colors duration-300">
      
      {/* Navbar */}
      <nav className="bg-indigo-700 dark:bg-indigo-950 text-white shadow-lg sticky top-0 z-50 transition-colors duration-300">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition" onClick={goBack}>
            <BookOpen className="h-8 w-8 text-indigo-200" />
            <h1 className="text-2xl font-bold tracking-wide">القارئ الذكي (Smart Reader)</h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-full hover:bg-white/10 transition-colors border border-white/10"
              title={isDarkMode ? "الوضع النهاري" : "الوضع الليلي"}
            >
              {isDarkMode ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} />}
            </button>
            <div className="hidden md:flex items-center gap-2 text-xs bg-indigo-800/80 dark:bg-indigo-900 px-3 py-1.5 rounded-full border border-white/5">
              <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-yellow-400' : error ? 'bg-red-400' : 'bg-green-400'}`}></div>
              {isLoading ? 'جاري الاتصال...' : error ? 'خطأ في الاتصال' : 'متصل بالـ API'}
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">

        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-96">
            <Loader2 className="w-12 h-12 animate-spin text-indigo-600 dark:text-indigo-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg">جاري جلب المقالات وتجهيز خادم الـ API...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-96 text-center max-w-md mx-auto">
            <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">فشل الاتصال بالخادم</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-6">تأكد أن خادم FastAPI يعمل على المنفذ 8080 وبأنك قمت بتغذية قاعدة البيانات.</p>
            <button onClick={fetchArticles} className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700 transition shadow-lg">
              إعادة المحاولة
            </button>
          </div>
        ) : !selectedArticle ? (
          /* --- Home Page --- */
          <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">

            {/* Header Card */}
            <div className="text-center py-10 px-6 bg-gradient-to-br from-white to-indigo-50/20 dark:from-gray-800 dark:to-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
              <h2 className="text-4xl font-extrabold text-gray-800 dark:text-gray-100 mb-3">مركز المعرفة الذكي</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-xl mx-auto">ابحث عن أي موضوع واقرأه بذكاء، أو استخلص مقالاً من رابط، أو تصفح مكتبتك.</p>

              {/* Tabs */}
              <div className="flex justify-center gap-2 mb-6">
                <button
                  onClick={() => setActiveTab('library')}
                  className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                    activeTab === 'library'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  📚 مكتبتي
                </button>
                <button
                  onClick={() => setActiveTab('search')}
                  className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                    activeTab === 'search'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  🔍 بحث على الويب
                </button>
              </div>

              <div className="max-w-2xl mx-auto space-y-4">
                {activeTab === 'library' ? (
                  <>
                    {/* Filter Search */}
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="البحث في مقالات مكتبتك..."
                        className="w-full p-4 pr-12 rounded-2xl border-2 border-indigo-50 dark:border-gray-700 dark:bg-gray-850 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none shadow-sm text-base transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      <Search className="absolute top-1/2 right-4 transform -translate-y-1/2 text-gray-400" />
                    </div>
                    {/* Scraper Input */}
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-indigo-50 dark:border-gray-700 shadow-md">
                      <p className="text-xs text-gray-400 dark:text-gray-500 mb-3 text-right">أو استخلص مقالاً من رابط مباشر:</p>
                      <div className="flex flex-col md:flex-row gap-3">
                        <div className="relative flex-1">
                          <input
                            type="url"
                            placeholder="أدخل رابط مقال من الويب..."
                            value={scrapeUrl}
                            onChange={(e) => setScrapeUrl(e.target.value)}
                            className="w-full p-3 pr-10 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-indigo-500 focus:outline-none text-sm transition-all"
                          />
                          <Globe className="absolute top-1/2 right-3 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        </div>
                        <button
                          onClick={handleScrape}
                          disabled={isScraping || !scrapeUrl.trim()}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-md"
                        >
                          {isScraping ? <><Loader2 className="animate-spin h-4 w-4" /><span>جاري الاستخلاص...</span></> : <span>استخلاص وقراءة المقال</span>}
                        </button>
                      </div>
                    </div>

                    {/* File Upload */}
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-indigo-50 dark:border-gray-700 shadow-md">
                      <p className="text-xs text-gray-400 dark:text-gray-500 mb-3 text-right">أو ارفع ملف مباشرة (PDF, Word, TXT):</p>
                      <input
                        type="file"
                        accept=".pdf,.docx,.txt"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={(e) => handleFileUpload(e.target.files[0])}
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="w-full flex items-center justify-center gap-3 p-4 rounded-xl border-2 border-dashed border-indigo-300 dark:border-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all text-indigo-600 dark:text-indigo-400 font-semibold text-sm disabled:opacity-50 cursor-pointer"
                      >
                        {isUploading ? (
                          <><Loader2 className="animate-spin h-5 w-5" /><span>جاري قراءة الملف...</span></>
                        ) : (
                          <><Upload className="h-5 w-5" /><span>اضغط لرفع ملف PDF أو Word أو TXT</span></>
                        )}
                      </button>
                      {uploadError && (
                        <p className="text-red-500 text-xs mt-2 text-right flex items-center gap-1 justify-end">
                          <AlertCircle className="h-3 w-3" />{uploadError}
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  /* Web Search Tab */
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          placeholder="ابحث عن أي موضوع... (مثال: الذكاء الاصطناعي، كرة القدم، الصحة)"
                          value={webSearchQuery}
                          onChange={(e) => setWebSearchQuery(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleWebSearch()}
                          className="w-full p-4 pr-12 rounded-2xl border-2 border-indigo-100 dark:border-gray-700 dark:bg-gray-700 dark:text-white focus:border-indigo-500 focus:outline-none text-base transition-all shadow-sm"
                        />
                        <Search className="absolute top-1/2 right-4 transform -translate-y-1/2 text-gray-400" />
                      </div>
                      <button
                        onClick={handleWebSearch}
                        disabled={isWebSearching || !webSearchQuery.trim()}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 disabled:opacity-50 shadow-md whitespace-nowrap"
                      >
                        {isWebSearching ? <Loader2 className="animate-spin h-4 w-4" /> : <Search size={16} />}
                        {isWebSearching ? 'جاري البحث...' : 'بحث'}
                      </button>
                    </div>
                    {webSearchResults.length > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-400">تم العثور على {webSearchResults.length} نتيجة</span>
                        <button onClick={() => { setWebSearchResults([]); setWebSearchQuery(''); }} className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1"><X size={12} /> مسح</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Web Search Results */}
            {activeTab === 'search' && webSearchResults.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {webSearchResults.map((result, idx) => (
                  <div key={idx} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 dark:border-gray-700 p-5 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-indigo-500 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950/40 px-2 py-1 rounded-full">{result.source}</span>
                      <a href={result.url} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-indigo-500 transition-colors"><ExternalLink size={14} /></a>
                    </div>
                    <h3 className="text-base font-bold text-gray-800 dark:text-gray-100 leading-snug line-clamp-2">{result.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-3 flex-1">{result.snippet}</p>
                    <button
                      onClick={() => handleScrapeFromSearch(result.url)}
                      disabled={isScraping}
                      className="w-full mt-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isScraping ? <><Loader2 className="animate-spin h-4 w-4" />جاري الجلب...</> : <><BookOpen size={15} />اقرأ المقال كاملاً</>}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'search' && !isWebSearching && webSearchResults.length === 0 && webSearchQuery && (
              <div className="text-center py-12 text-gray-400">
                <Search size={40} className="mx-auto mb-3 opacity-30" />
                <p>لا توجد نتائج. جرب كلمات بحث مختلفة.</p>
              </div>
            )}

            {/* Grid of Articles (library tab) */}
            {activeTab === 'library' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredArticles.map((article) => (
                  <div
                    key={article.id}
                    onClick={() => { setSelectedArticle(article); setChatHistory([]); }}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 overflow-hidden cursor-pointer border border-gray-100 dark:border-gray-700 group flex flex-col h-full"
                  >
                    <div className="h-48 overflow-hidden relative">
                      <img
                        src={article.image || DEFAULT_IMAGE_URL}
                        alt={article.title}
                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => { e.target.src = DEFAULT_IMAGE_URL }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                    </div>

                    <div className="p-6 flex flex-col flex-1">
                      <span className="self-start inline-block px-3 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-bold mb-3 border border-indigo-100/30">
                        {article.category || "عام"}
                      </span>
                      <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2 line-clamp-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {article.title}
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 line-clamp-3 leading-relaxed flex-1">
                        {article.content}
                      </p>
                      <div className="flex justify-between items-center text-xs text-gray-400 dark:text-gray-500 border-t dark:border-gray-700/60 pt-4">
                        <span className="flex items-center gap-1"><User size={12} /> {article.author || "ويب"}</span>
                        <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-bold">قراءة واستماع <ArrowRight size={12} className="rotate-180" /></span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* --- Article Details Page with Sidebar Layout --- */
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-fade-in-up">
            
            {/* Article Content Area (2/3 width) */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
              
              {/* Cover Image & Header */}
              <div className="h-72 md:h-96 w-full relative">
                <img 
                  src={selectedArticle.image || DEFAULT_IMAGE_URL} 
                  alt={selectedArticle.title} 
                  className="w-full h-full object-cover" 
                />
                <button onClick={goBack} className="absolute top-4 right-4 bg-white/90 dark:bg-gray-800/90 p-2.5 rounded-full hover:bg-white dark:hover:bg-gray-700 transition shadow-lg text-gray-800 dark:text-white z-10">
                  <ArrowRight className="h-6 w-6" />
                </button>
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 text-white">
                  <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold mb-3 inline-block border border-white/20">{selectedArticle.category || "ويب"}</span>
                  <h2 className="text-2xl md:text-4xl font-extrabold mb-2 leading-tight">{selectedArticle.title}</h2>
                  <p className="opacity-80 flex items-center gap-2 text-sm"><User size={14} /> {selectedArticle.author || "ويب"}</p>
                </div>
              </div>

              {/* Toolbar */}
              <div className="p-6 md:p-8">
                <div className="flex flex-wrap gap-3 mb-8 border-b pb-6 border-gray-100 dark:border-gray-750 items-center justify-between">
                  <button
                    onClick={handleSummarize}
                    disabled={isSummarizing}
                    className={`flex items-center gap-2 px-5 py-3 rounded-xl transition-all font-bold text-sm ${isSummarizing ? 'opacity-70 cursor-not-allowed' : ''} ${showSummary
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60'
                      }`}
                  >
                    {isSummarizing ? <><Loader2 className="animate-spin" size={16} /> جاري التلخيص...</> : <><FileText size={18} />{showSummary ? 'إخفاء التلخيص' : 'تلخيص بالذكاء الاصطناعي'}</>}
                  </button>

                  <div className="flex items-center gap-3">
                    {/* Pulsing Audio Waveform when speaking */}
                    {isSpeaking && !isPaused && (
                      <div className="flex items-end gap-0.5 h-5 px-2">
                        <div className="w-1 bg-indigo-500 rounded-full animate-[pulse_0.8s_infinite] h-4"></div>
                        <div className="w-1 bg-indigo-500 rounded-full animate-[pulse_0.5s_infinite] h-5"></div>
                        <div className="w-1 bg-indigo-500 rounded-full animate-[pulse_0.9s_infinite] h-3"></div>
                        <div className="w-1 bg-indigo-500 rounded-full animate-[pulse_0.6s_infinite] h-4"></div>
                      </div>
                    )}

                    {!isSpeaking && !isPaused ? (
                      <button
                        onClick={handleSpeak}
                        className="flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition shadow-md group"
                      >
                        <Headphones size={18} className="group-hover:scale-110 transition-transform" /> استمع للمقال
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-950/40 p-1.5 rounded-xl border border-indigo-100/40 dark:border-indigo-900/40">
                        <button
                          onClick={handleSpeak}
                          className="p-2 rounded-lg hover:bg-white dark:hover:bg-gray-800 text-indigo-700 dark:text-indigo-300 transition"
                          title={isPaused ? "استئناف" : "إيقاف مؤقت"}
                        >
                          {isPaused ? <PlayCircle size={22} /> : <PauseCircle size={22} />}
                        </button>
                        <button
                          onClick={handleStopSpeak}
                          className="p-2 rounded-lg hover:bg-white dark:hover:bg-gray-800 text-red-500 transition"
                          title="إيقاف"
                        >
                          <StopCircle size={22} />
                        </button>
                        <span className="text-[10px] font-bold text-indigo-900 dark:text-indigo-300 px-2">
                          {isPaused ? "متوقف مؤقتاً" : "جاري القراءة..."}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Article Body */}
                <div className="prose prose-lg max-w-none text-gray-700 dark:text-gray-300 leading-loose text-lg font-normal">
                  {showSummary && (
                    <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900 p-6 mb-8 rounded-2xl relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1 bg-amber-400"></div>
                      <h4 className="font-bold text-amber-800 dark:text-amber-400 mb-3 flex items-center gap-2 text-base">
                        <span className="w-2 h-2 bg-amber-500 rounded-full animate-ping"></span>
                        الملخص الذكي
                      </h4>
                      {summaryError ? (
                        <p className="text-red-600 text-sm mb-2">{summaryError}</p>
                      ) : (
                        <p className="text-amber-950/90 dark:text-amber-200/90 text-base leading-relaxed">{selectedArticle.summary || "لا يوجد ملخص متاح لهذا المقال حالياً."}</p>
                      )}
                    </div>
                  )}
                  <p className="whitespace-pre-line text-justify leading-relaxed dark:text-gray-300">{selectedArticle.content}</p>
                </div>

                {/* Comments Section */}
                <div className="mt-16 pt-10 border-t border-gray-150 dark:border-gray-700/60">
                  <h3 className="text-2xl font-bold mb-6 flex items-center gap-3 text-gray-800 dark:text-white">
                    <span className="bg-indigo-50 dark:bg-indigo-950 p-2 rounded-xl text-indigo-600 dark:text-indigo-400"><MessageSquare size={22} /></span>
                    التعليقات والمشاعر ({selectedArticle.comments ? selectedArticle.comments.length : 0})
                  </h3>

                  {/* Comment Input */}
                  <div className="bg-white dark:bg-gray-800/80 p-1 mb-8 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="اكتب تعليقك هنا..."
                      className="w-full p-4 rounded-t-2xl outline-none resize-none h-24 text-gray-700 dark:text-gray-200 bg-transparent text-sm"
                    ></textarea>
                    <div className="bg-gray-50 dark:bg-gray-750 p-2.5 flex justify-between items-center rounded-b-2xl border-t border-gray-100 dark:border-gray-700">
                      <span className="text-xs text-gray-400 dark:text-gray-500">تحليل فوري لمشاعر التعليق بالذكاء الاصطناعي</span>
                      <button
                        onClick={handlePostComment}
                        disabled={isPostingComment || !newComment.trim()}
                        className={`flex items-center gap-2 px-5 py-2 rounded-xl font-bold text-sm transition-all ${!newComment.trim() ? 'bg-gray-200 text-gray-400 dark:bg-gray-700' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                      >
                        {isPostingComment ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                        نشر التعليق
                      </button>
                    </div>
                  </div>

                  {/* Comments List */}
                  <div className="space-y-4">
                    {selectedArticle.comments && selectedArticle.comments.length > 0 ? (
                      selectedArticle.comments.map((comment) => (
                        <div key={comment.id} className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-750 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-start transition-colors">
                          <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold shrink-0">
                              {comment.user?.name ? comment.user.name.charAt(0) : '?'}
                            </div>
                            <div>
                              <div className="font-bold text-gray-900 dark:text-white text-sm">{comment.user?.name || "مستخدم"}</div>
                              <p className="text-gray-600 dark:text-gray-300 mt-1 text-sm">{comment.text}</p>
                            </div>
                          </div>

                          <div className={`px-4 py-1.5 rounded-full text-xs font-extrabold flex items-center gap-2 whitespace-nowrap self-end md:self-start ${getSentimentStyle(comment.sentiment)}`}>
                            {comment.sentiment === 'POSITIVE' && <><ThumbsUp size={14} /> إيجابي</>}
                            {comment.sentiment === 'NEGATIVE' && <><ThumbsDown size={14} /> سلبي</>}
                            {(!comment.sentiment || comment.sentiment === 'NEUTRAL') && <><Minus size={14} /> محايد</>}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-400 dark:text-gray-500 text-center py-6 text-sm">لا توجد تعليقات بعد. كن أول من يعلق!</p>
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* AI Chatbot Sidebar (1/3 width) */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden sticky top-24 flex flex-col h-[600px]">
              
              {/* Chat Header */}
              <div className="bg-indigo-50 dark:bg-gray-750 p-4 border-b border-gray-150 dark:border-gray-700 flex items-center gap-2 shrink-0">
                <div className="bg-indigo-600 text-white p-1.5 rounded-lg">
                  <MessageSquare size={18} />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-gray-800 dark:text-white">مساعد القراءة التفاعلي</h4>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500">اطرح أي سؤال حول المقال (بالعربية أو الإنجليزية)</p>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 dark:bg-gray-900/10">
                {chatHistory.length === 0 ? (
                  <div className="text-center py-12 text-gray-400 dark:text-gray-500 space-y-2">
                    <p className="text-sm">أهلاً بك! أنا مساعدك الذكي الخاص بهذا المقال.</p>
                    <p className="text-xs">اسألني مثل: "ما هي النقاط الرئيسية للمقال؟"</p>
                  </div>
                ) : (
                  chatHistory.map((chat, idx) => (
                    <div
                      key={idx}
                      className={`flex ${chat.role === 'user' ? 'justify-start' : 'justify-end'} animate-fade-in`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                          chat.role === 'user'
                            ? 'bg-indigo-600 text-white rounded-br-none'
                            : 'bg-white dark:bg-gray-700 text-gray-850 dark:text-gray-200 border border-gray-150 dark:border-gray-650 rounded-bl-none shadow-sm'
                        }`}
                      >
                        <p className="whitespace-pre-line">{chat.content}</p>
                      </div>
                    </div>
                  ))
                )}
                {isChatLoading && (
                  <div className="flex justify-end animate-pulse">
                    <div className="bg-white dark:bg-gray-700 rounded-2xl rounded-bl-none px-4 py-3 border border-gray-150 dark:border-gray-650 shadow-sm flex items-center gap-2">
                      <Loader2 className="animate-spin text-indigo-600 dark:text-indigo-400 h-4 w-4" />
                      <span className="text-xs text-gray-400">يفكر المساعد...</span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input */}
              <div className="p-3 border-t border-gray-150 dark:border-gray-700 bg-white dark:bg-gray-850 shrink-0">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
                    placeholder="اسألني عن المقال..."
                    className="flex-1 p-2.5 rounded-xl border border-gray-200 dark:border-gray-650 dark:bg-gray-800 dark:text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={handleSendChatMessage}
                    disabled={isChatLoading || !chatInput.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-xl transition-all disabled:opacity-50"
                  >
                    <Send size={18} className="rotate-180" />
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}
      </main>
    </div>
  );
}