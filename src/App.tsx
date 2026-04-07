import React, { useState } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { Copy, Loader2, Sparkles, Check, Code, List, Image as ImageIcon } from 'lucide-react';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface GeneratedItem {
  id: number;
  title: string;
  category: string[];
  ratio: string;
  downloads: string;
  prompt: string;
  promptEn?: string;
  tags: string[];
  similar: number[];
  poster: string;
}

export default function App() {
  const [language, setLanguage] = useState('English');
  const [theme, setTheme] = useState('');
  const [keywords, setKeywords] = useState('');
  const [outputData, setOutputData] = useState<GeneratedItem[] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [copiedPromptKey, setCopiedPromptKey] = useState<string | null>(null);
  const [copiedAllPrompts, setCopiedAllPrompts] = useState<'local' | 'en' | 'filenames' | null>(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'json' | 'prompts' | 'filenames'>('json');

  const handleGenerate = async () => {
    setError('');
    if (!theme.trim()) {
      setError('请输入资源页主题 (Please enter a Resource Page Theme).');
      return;
    }

    setIsGenerating(true);
    setOutputData(null);

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: `You are an expert AI image prompt engineer and localization expert.
        The user wants to generate a resource library of AI image prompts based on a theme.
        
        Target Market/Language: "${language}"
        Theme: "${theme}"
        Optional Keywords: "${keywords}"

        Please generate exactly 20 high-quality, highly detailed, and cinematic AI image generation prompts.
        Ensure a diverse mix of scenarios, characters, lighting, and compositions that fit the theme perfectly.
        Vary the aspect ratios among 9:16 (vertical), 1:1 (square), and 16:9 (horizontal).
        
        CRITICAL LOCALIZATION INSTRUCTION: 
        - The "title", "category", "prompt", and "tags" MUST be translated and localized into the Target Market/Language ("${language}").
        - If the Target Market/Language is NOT English, you MUST also provide the English version of the prompt in the "promptEn" field. If the target language is English, you can omit "promptEn" or make it the same as "prompt".
        - The "englishSlug" MUST be a hyphen-separated lowercase English string representing the title (e.g., "golden-sunrise-songkran-portrait"). This will be used for URLs.
        - The "category" field must be an array of exactly 5 localized strings relevant to the prompt and theme.

        CRITICAL: You MUST explicitly mention the aspect ratio format inside the prompt text itself (e.g., "vertical 9:16 format", "square 1:1 format", "horizontal 16:9 format").

        For each prompt, provide:
        1. title: Summarize the prompt's main subject in the target language. Maximum 7 words.
        2. englishSlug: The English translation of the title, formatted as a lowercase hyphenated slug (e.g., "golden-retriever-oscar-red-carpet").
        3. category: Array of exactly 5 localized category strings.
        4. ratio: Must be exactly "ratio-9-16", "ratio-1-1", or "ratio-16-9".
        5. prompt: The detailed image generation prompt, localized in the target language.
        6. promptEn: The English version of the prompt (required if target language is not English).
        7. tags: 3 to 5 contextual tags in the target language.

        Return a JSON array of these 20 objects.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: "Localized title" },
                englishSlug: { type: Type.STRING, description: "English translation of title as hyphenated slug" },
                category: { type: Type.ARRAY, items: { type: Type.STRING }, description: "5 localized category strings" },
                ratio: { type: Type.STRING, description: "Must be ratio-9-16, ratio-1-1, or ratio-16-9" },
                prompt: { type: Type.STRING, description: "Localized prompt" },
                promptEn: { type: Type.STRING, description: "English prompt" },
                tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3-5 localized tags" }
              },
              required: ["title", "englishSlug", "category", "ratio", "prompt", "tags"]
            }
          }
        }
      });

      if (!response.text) {
        throw new Error('No response from AI');
      }

      const generatedArray = JSON.parse(response.text);
      const themeSlug = theme.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      const finalData: GeneratedItem[] = generatedArray.map((item: any, index: number) => {
        const downloads = `${(Math.random() * 10.0 + 5.0).toFixed(1)}K`; // Random between 5.0K and 15.0K
        
        const similar: number[] = [];
        while(similar.length < 4) {
          const r = Math.floor(Math.random() * 20) + 1;
          if(similar.indexOf(r) === -1 && r !== (index + 1)) similar.push(r);
        }
        
        return {
          id: index + 1,
          title: item.title,
          category: item.category,
          ratio: item.ratio,
          downloads: downloads,
          prompt: item.prompt,
          ...(language.toLowerCase() !== 'english' && item.promptEn ? { promptEn: item.promptEn } : {}),
          tags: item.tags,
          similar: similar,
          poster: `https://images.wondershare.com/filmora/ai-prompt/${themeSlug}/${item.englishSlug}.jpg`
        };
      });

      setOutputData(finalData);
      setActiveTab('json');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while generating.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyJson = () => {
    if (outputData) {
      navigator.clipboard.writeText(JSON.stringify(outputData, null, 2));
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
    }
  };

  const handleCopyPrompt = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPromptKey(key);
    setTimeout(() => setCopiedPromptKey(null), 2000);
  };

  const handleCopyAllPrompts = (type: 'local' | 'en') => {
    if (outputData) {
      const allPrompts = outputData.map((item, index) => {
        const text = type === 'en' && item.promptEn ? item.promptEn : item.prompt;
        return `prompt ${index + 1}: ${text}`;
      }).join('\n\n');
      navigator.clipboard.writeText(allPrompts);
      setCopiedAllPrompts(type);
      setTimeout(() => setCopiedAllPrompts(null), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex items-center space-x-3 pb-6 border-b border-gray-200">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">资源框代码生成工具</h1>
            <p className="text-sm text-gray-500">AI Prompt Resource Generator</p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Panel: Input */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  目标市场语言 (Target Market Language) <span className="text-red-500">*</span>
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-gray-900 bg-white"
                >
                  <option value="English">English</option>
                  <option value="Chinese (Simplified)">Chinese (Simplified)</option>
                  <option value="Chinese (Traditional)">Chinese (Traditional)</option>
                  <option value="German">German</option>
                  <option value="French">French</option>
                  <option value="Spanish">Spanish</option>
                  <option value="Italian">Italian</option>
                  <option value="Portuguese">Portuguese</option>
                  <option value="Japanese">Japanese</option>
                  <option value="Korean">Korean</option>
                  <option value="Russian">Russian</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  资源页主题 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  placeholder="例如: Good Friday Gemini Prompts"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-gray-900"
                />
                <p className="mt-2 text-xs text-gray-500 leading-relaxed">
                  用于生成 poster 链接中的目录路径，如: good-friday-gemini-prompts
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  相关关键词序列 <span className="text-gray-400 font-normal">(选填)</span>
                </label>
                <textarea
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="例如: cross, church, sunrise, holy, cinematic (空格或逗号分隔均可)"
                  className="w-full h-24 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors resize-none text-gray-900 text-sm"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
                  {error}
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>AI 正在生成 20 条资源...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>一键生成资源代码</span>
                  </>
                )}
              </button>

              <div className="pt-4 border-t border-gray-100">
                <p className="text-sm text-blue-600 bg-blue-50 p-3 rounded-lg border border-blue-100">
                  💡 <strong>提示：</strong>你只需要输入资源页主题，右边会自动生成涵盖不同场景、人物和尺寸的20条及以上资源库 JSON 代码。
                </p>
              </div>
            </div>
          </div>

          {/* Right Panel: Output */}
          <div className="lg:col-span-8 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden h-[800px]">
            {/* Tabs Header */}
            <div className="flex items-center justify-between px-2 pt-2 bg-gray-50 border-b border-gray-200">
              <div className="flex space-x-1">
                <button
                  onClick={() => setActiveTab('json')}
                  className={`px-4 py-2.5 text-sm font-medium rounded-t-lg flex items-center space-x-2 transition-colors ${
                    activeTab === 'json'
                      ? 'bg-white text-blue-600 border-t border-l border-r border-gray-200 shadow-[0_1px_0_white]'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                  style={{ marginBottom: '-1px' }}
                >
                  <Code className="w-4 h-4" />
                  <span>JSON 代码</span>
                </button>
                <button
                  onClick={() => setActiveTab('prompts')}
                  className={`px-4 py-2.5 text-sm font-medium rounded-t-lg flex items-center space-x-2 transition-colors ${
                    activeTab === 'prompts'
                      ? 'bg-white text-blue-600 border-t border-l border-r border-gray-200 shadow-[0_1px_0_white]'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                  style={{ marginBottom: '-1px' }}
                >
                  <List className="w-4 h-4" />
                  <span>Prompts 列表</span>
                </button>
                <button
                  onClick={() => setActiveTab('filenames')}
                  className={`px-4 py-2.5 text-sm font-medium rounded-t-lg flex items-center space-x-2 transition-colors ${
                    activeTab === 'filenames'
                      ? 'bg-white text-blue-600 border-t border-l border-r border-gray-200 shadow-[0_1px_0_white]'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                  style={{ marginBottom: '-1px' }}
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>图片命名</span>
                </button>
              </div>
              
              {activeTab === 'json' && outputData && (
                <button
                  onClick={handleCopyJson}
                  className="mb-2 mr-2 flex items-center space-x-1.5 px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-medium rounded-md transition-colors shadow-sm"
                >
                  {copiedJson ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedJson ? '已复制!' : '复制全部 JSON'}</span>
                </button>
              )}
              {activeTab === 'prompts' && outputData && (
                <div className="flex space-x-2 mb-2 mr-2">
                  <button
                    onClick={() => handleCopyAllPrompts('local')}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-medium rounded-md transition-colors shadow-sm"
                  >
                    {copiedAllPrompts === 'local' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedAllPrompts === 'local' ? '已复制!' : `复制全部 Prompt (${language})`}</span>
                  </button>
                  {outputData.some(item => item.promptEn) && (
                    <button
                      onClick={() => handleCopyAllPrompts('en')}
                      className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md transition-colors shadow-sm"
                    >
                      {copiedAllPrompts === 'en' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedAllPrompts === 'en' ? '已复制!' : '复制全部 Prompt (English)'}</span>
                    </button>
                  )}
                </div>
              )}
              {activeTab === 'filenames' && outputData && (
                <button
                  onClick={() => {
                    const allFilenames = outputData.map(item => item.poster.split('/').pop()?.replace('.jpg', '')).join('\n');
                    navigator.clipboard.writeText(allFilenames);
                    setCopiedAllPrompts('filenames');
                    setTimeout(() => setCopiedAllPrompts(null), 2000);
                  }}
                  className="mb-2 mr-2 flex items-center space-x-1.5 px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-medium rounded-md transition-colors shadow-sm"
                >
                  {copiedAllPrompts === 'filenames' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedAllPrompts === 'filenames' ? '已复制!' : '复制全部命名'}</span>
                </button>
              )}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-auto bg-gray-50 p-4 custom-scrollbar">
              {!outputData ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                  <Sparkles className="w-12 h-12 text-gray-300" />
                  <p className="text-sm">生成的代码将显示在这里...</p>
                </div>
              ) : activeTab === 'json' ? (
                <div className="bg-gray-900 rounded-lg p-4 h-full overflow-auto">
                  <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap break-all">
                    {JSON.stringify(outputData, null, 2)}
                  </pre>
                </div>
              ) : activeTab === 'filenames' ? (
                <div className="space-y-3">
                  {outputData.map((item) => {
                    const filename = item.poster.split('/').pop()?.replace('.jpg', '') || '';
                    return (
                      <div key={item.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                        <div className="flex items-center space-x-4 overflow-hidden">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex-shrink-0">
                            {item.id}
                          </span>
                          <div className="truncate">
                            <h3 className="text-sm font-bold text-gray-900 truncate">{item.title}</h3>
                            <p className="text-sm text-gray-500 font-mono mt-1 truncate">{filename}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleCopyPrompt(`${item.id}-filename`, filename)}
                          className={`flex-shrink-0 flex items-center space-x-1.5 px-3 py-2 rounded-md border transition-colors text-sm font-medium ${
                            copiedPromptKey === `${item.id}-filename`
                              ? 'bg-green-50 border-green-200 text-green-700'
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {copiedPromptKey === `${item.id}-filename` ? (
                            <>
                              <Check className="w-4 h-4" />
                              <span>已复制</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              <span>复制命名</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-4">
                  {outputData.map((item) => (
                    <div key={item.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center space-x-2">
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                              {item.id}
                            </span>
                            <h3 className="text-sm font-bold text-gray-900">{item.title}</h3>
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                              {item.ratio}
                            </span>
                          </div>
                          
                          {item.category && item.category.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {item.category.map((cat, i) => (
                                <span key={i} className="px-2 py-0.5 rounded text-[10px] font-medium bg-purple-50 text-purple-600 border border-purple-100">
                                  {cat}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="space-y-2 mt-2">
                            <div className="bg-gray-50 p-3 rounded border border-gray-100 relative group">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">[{language}] Prompt</span>
                                <button
                                  onClick={() => handleCopyPrompt(`${item.id}-local`, item.prompt)}
                                  className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                                    copiedPromptKey === `${item.id}-local`
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300 opacity-0 group-hover:opacity-100'
                                  }`}
                                >
                                  {copiedPromptKey === `${item.id}-local` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                  <span>{copiedPromptKey === `${item.id}-local` ? '已复制' : '复制'}</span>
                                </button>
                              </div>
                              <p className="text-sm text-gray-700 font-mono leading-relaxed">{item.prompt}</p>
                            </div>
                            
                            {item.promptEn && (
                              <div className="bg-blue-50 p-3 rounded border border-blue-100 relative group">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-xs font-bold text-blue-500 uppercase tracking-wider">[English] Prompt</span>
                                  <button
                                    onClick={() => handleCopyPrompt(`${item.id}-en`, item.promptEn)}
                                    className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                                      copiedPromptKey === `${item.id}-en`
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-blue-200 text-blue-700 hover:bg-blue-300 opacity-0 group-hover:opacity-100'
                                    }`}
                                  >
                                    {copiedPromptKey === `${item.id}-en` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                    <span>{copiedPromptKey === `${item.id}-en` ? '已复制' : '复制'}</span>
                                  </button>
                                </div>
                                <p className="text-sm text-gray-700 font-mono leading-relaxed">{item.promptEn}</p>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-1 pt-2">
                            {item.tags && item.tags.map((tag, i) => (
                              <span key={i} className="px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-500">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
