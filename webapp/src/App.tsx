import { useState, useRef, useEffect } from 'react';
import { Loader2, Plus, Image as ImageIcon, Volume2, Video as VideoIcon, Play, Upload, Edit } from 'lucide-react';
import { generateScript, generateImage, generateAudio, uploadVoiceReference, submitVideoJob, pollVideoStatus, getVideoResult, editImage } from './services/eigenai';
import type { Scene } from './services/eigenai';

function App() {
  const [prompt, setPrompt] = useState('A sci-fi short film about a rogue AI encountering a human child. Cyberpunk aesthetic.');
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState('');
  const [lightboxType, setLightboxType] = useState<'image' | 'video'>('image');

  const [selectedVoice, setSelectedVoice] = useState('Linda');
  const [voiceMap, setVoiceMap] = useState<Record<string, string>>({
    'Linda (Default)': 'Linda',
    'Jack (Default)': 'Jack'
  });
  const [isUploadingVoice, setIsUploadingVoice] = useState(false);

  const pollingIntervals = useRef<Record<string, ReturnType<typeof setInterval>>>({});

  useEffect(() => {
    return () => {
      Object.values(pollingIntervals.current).forEach(clearInterval);
    };
  }, []);

  const handleGenerateScript = async () => {
    try {
      setIsGeneratingScript(true);
      const data = await generateScript(prompt);
      setScenes(data);
    } catch (e) {
      console.error(e);
      alert('Failed to generate script.');
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const handleGenerateImage = async (sceneId: string, description: string) => {
    try {
      setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, status: 'generating' } : s));
      const imageUrl = await generateImage(description);
      setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, status: 'completed', imageUrl } : s));
    } catch (e) {
      console.error(e);
      setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, status: 'error' } : s));
    }
  };

  const handleGenerateActionImage = async (sceneId: string, actionText: string, sourceImageUrl: string) => {
    try {
      setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, actionStatus: 'generating' } : s));
      const actionImageUrl = await editImage(actionText, sourceImageUrl);
      setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, actionStatus: 'completed', actionImageUrl } : s));
    } catch (e) {
      console.error(e);
      setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, actionStatus: 'error' } : s));
    }
  };

  const handleGenerateAudio = async (sceneId: string, text: string) => {
    if (!text || text.trim() === '' || text.trim().toLowerCase() === 'silence.') return;
    try {
      setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, audioStatus: 'generating' } : s));
      const audioUrl = await generateAudio(text, selectedVoice);
      setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, audioStatus: 'completed', audioUrl } : s));
    } catch (e) {
      console.error(e);
      setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, audioStatus: 'error' } : s));
    }
  };

  const handleUploadVoice = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    try {
      setIsUploadingVoice(true);
      const file = e.target.files[0];
      const id = await uploadVoiceReference(file);
      setVoiceMap(prev => ({ ...prev, [file.name]: id }));
      setSelectedVoice(id);
    } catch (err) {
      console.error(err);
      alert('Voice upload failed.');
    } finally {
      setIsUploadingVoice(false);
    }
  };

  const handleGenerateVideo = async (sceneId: string, promptText: string, imageUrl: string, isAction: boolean = false) => {
    try {
      const statusKey = isAction ? 'actionVideoStatus' : 'videoStatus';
      const urlKey = isAction ? 'actionVideoUrl' : 'videoUrl';
      const taskIdKey = isAction ? 'actionTaskId' : 'taskId';
      const pollKey = `${sceneId}_${isAction ? 'action' : 'base'}`;

      setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, [statusKey]: 'pending' } : s));
      const taskId = await submitVideoJob(promptText, imageUrl);
      setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, [taskIdKey]: taskId, [statusKey]: 'processing' } : s));
      
      pollingIntervals.current[pollKey] = setInterval(async () => {
        try {
          const res = await pollVideoStatus(taskId);
          if (res.status === 'completed') {
            clearInterval(pollingIntervals.current[pollKey]);
            const finalUrl = await getVideoResult(taskId);
            setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, [statusKey]: 'completed', [urlKey]: finalUrl } : s));
          } else if (res.status === 'failed') {
            clearInterval(pollingIntervals.current[pollKey]);
            setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, [statusKey]: 'failed' } : s));
          }
        } catch (err) {
           console.error('Polling error', err);
        }
      }, 5000);
    } catch (e) {
      console.error(e);
      setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, [isAction ? 'actionVideoStatus' : 'videoStatus']: 'failed' } : s));
    }
  };

  const [isAssembling, setIsAssembling] = useState(false);

  // ... earlier functions
  const handleFinalizeVideo = async () => {
    const validScenes = scenes.filter(s => s.videoUrl || s.actionVideoUrl);
    if (validScenes.length === 0) return alert('No finalized videos to assemble!');

    setIsAssembling(true);
    try {
      const form = new FormData();
      form.append('sceneCount', String(validScenes.length));

      for (let i = 0; i < validScenes.length; i++) {
          const scene = validScenes[i];
          const videoUrl = scene.actionVideoUrl || scene.videoUrl;
          
          if (videoUrl) {
             const vRes = await fetch(videoUrl);
             const vBlob = await vRes.blob();
             form.append(`video_${i}`, vBlob, `video_${i}.mp4`);
          }

          if (scene.audioUrl) {
             const aRes = await fetch(scene.audioUrl);
             const aBlob = await aRes.blob();
             form.append(`audio_${i}`, aBlob, `audio_${i}.mp3`);
          }
      }

      const response = await fetch('http://localhost:3001/api/assemble', {
         method: 'POST',
         body: form
      });

      if (!response.ok) throw new Error('Assembly failed');

      const blob = await response.blob();
      const finalUrl = URL.createObjectURL(blob);
      openLightbox(finalUrl, 'video');
    } catch (e) {
      console.error(e);
      alert('Failed to assemble final video.');
    } finally {
      setIsAssembling(false);
    }
  };

  const openLightbox = (url: string, type: 'image' | 'video' = 'image') => {
    setLightboxUrl(url);
    setLightboxType(type);
    setLightboxOpen(true);
  };

  return (
    <div className="min-h-screen pb-24">
      <header className="glass-panel sticky top-4 mx-4 md:mx-auto max-w-7xl z-10 p-4 flex justify-between items-center bg-black/50">
        <h1 className="text-xl ml-2 font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
          EigenAI Cinematic Studio
        </h1>
        <div className="flex items-center gap-4 mr-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-400">Voice clone:</span>
            <select 
              value={selectedVoice} 
              onChange={e => setSelectedVoice(e.target.value)}
              className="glass-input text-sm p-1.5 rounded-md max-w-[150px]"
            >
              {Object.entries(voiceMap).map(([name, id]) => (
                <option key={id} value={id}>{name.length > 20 ? name.substring(0,20)+'...' : name}</option>
              ))}
            </select>
          </div>
          <label className="glass-button px-3 py-1.5 rounded-md text-sm text-white flex items-center gap-2 cursor-pointer hover:border-purple-400 disabled:opacity-50">
            {isUploadingVoice ? <Loader2 className="w-4 h-4 animate-spin"/> : <Upload className="w-4 h-4"/>}
            Upload Ref
            <input type="file" accept="audio/*" className="hidden" onChange={handleUploadVoice} disabled={isUploadingVoice} />
          </label>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 mt-8 flex flex-col gap-6">
        <div className="glass-panel p-6 flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-white">1. Story Concept</h2>
          <textarea 
            className="glass-input w-full p-4 rounded-lg resize-none text-base border-white/10"
            rows={2}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe your cinematic short film concept..."
          />
          <button 
            onClick={handleGenerateScript}
            disabled={isGeneratingScript}
            className="glass-button self-end px-6 py-2.5 rounded-lg text-white font-medium flex items-center justify-center gap-2 hover:border-purple-500 min-w-[200px]"
          >
            {isGeneratingScript ? <Loader2 className="animate-spin w-5 h-5"/> : <Plus className="w-5 h-5"/>}
            {isGeneratingScript ? 'Writing Script...' : 'Generate Script'}
          </button>
        </div>

        {scenes.length > 0 && (
          <div className="glass-panel p-6 overflow-hidden">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-white">2. Scene Editor</h2>
                <button 
                  onClick={handleFinalizeVideo}
                  disabled={isAssembling}
                  className="glass-button px-5 py-2 rounded-lg text-white bg-gradient-to-r from-purple-500/20 to-pink-500/20 font-medium hover:from-purple-500/40 hover:to-pink-500/40 border border-purple-500/50 flex items-center gap-2 disabled:opacity-50"
                >
                  {isAssembling ? <Loader2 className="w-4 h-4 animate-spin"/> : <Play className="w-4 h-4" />} 
                  {isAssembling ? 'Assembling...' : 'Finalize Video'}
                </button>
             </div>
             <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse min-w-[1000px]">
                 <thead>
                   <tr className="border-b border-white/10 text-zinc-400">
                     <th className="p-4 w-12 text-center font-medium">#</th>
                     <th className="p-4 w-[33%] font-medium">Base Scene</th>
                     <th className="p-4 w-[33%] font-medium">Action Modifier</th>
                     <th className="p-4 w-[33%] font-medium">Dialogue & Audio</th>
                   </tr>
                 </thead>
                 <tbody>
                   {scenes.map((scene, i) => (
                     <tr key={scene.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                       <td className="p-4 text-center font-mono text-zinc-500 align-top pt-8">{i + 1}</td>
                       
                       {/* Base Scene */}
                       <td className="p-4 align-top">
                         <div className="flex flex-col gap-3">
                           <textarea 
                             className="glass-input w-full p-3 h-24 rounded-lg text-sm resize-none leading-relaxed border-white/10"
                             value={scene.description}
                             onChange={(e) => setScenes(prev => prev.map(s => s.id === scene.id ? { ...s, description: e.target.value } : s))}
                             placeholder="Visual description..."
                           />
                           
                           {/* Base Visual Thumbnails */}
                           <div className="relative w-full h-32 rounded-lg bg-black/40 border border-white/5 flex items-center justify-center overflow-hidden">
                               {scene.videoUrl ? (
                                  <>
                                    <video src={scene.videoUrl} className="absolute inset-0 w-full h-full object-cover" />
                                    <div 
                                      className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer hover:bg-black/20 transition"
                                      onClick={() => openLightbox(scene.videoUrl!, 'video')}
                                    >
                                      <Play className="w-8 h-8 text-white drop-shadow-md" />
                                    </div>
                                  </>
                               ) : scene.imageUrl ? (
                                  <img 
                                    src={scene.imageUrl} 
                                    className="w-full h-full object-cover cursor-zoom-in hover:brightness-110 transition"
                                    onClick={() => openLightbox(scene.imageUrl!, 'image')}
                                    alt="Base visual"
                                  />
                               ) : (
                                  <div className="text-zinc-600 text-xs italic flex items-center gap-1">
                                     <ImageIcon className="w-4 h-4 opacity-50" /> No Visuals
                                  </div>
                               )}
                           </div>
                           
                           <div className="flex gap-2">
                             <button 
                               disabled={scene.status === 'generating'}
                               onClick={() => handleGenerateImage(scene.id, scene.description)}
                               className="glass-button flex-1 px-2 py-2 rounded text-xs text-white flex items-center justify-center gap-1 disabled:opacity-50"
                             >
                                {scene.status === 'generating' ? <Loader2 className="animate-spin w-3 h-3"/> : <ImageIcon className="w-3 h-3"/>}
                                {scene.imageUrl ? 'Redo Image' : 'Image'}
                             </button>
                             <button 
                               disabled={!scene.imageUrl || ['pending','processing'].includes(scene.videoStatus || '')}
                               onClick={() => handleGenerateVideo(scene.id, scene.description, scene.imageUrl!)}
                               className="glass-button flex-1 px-2 py-2 rounded text-xs text-[#FFC423] font-semibold border-[#FFC423]/30 flex items-center justify-center gap-1 disabled:opacity-30"
                             >
                                {['pending','processing'].includes(scene.videoStatus || '') ? <Loader2 className="animate-spin w-3 h-3"/> : <VideoIcon className="w-3 h-3"/>}
                                {scene.videoUrl ? 'Redo Video' : 'Video'}
                             </button>
                           </div>
                         </div>
                       </td>

                       {/* Action Modifier */}
                       <td className="p-4 align-top">
                         <div className="flex flex-col gap-3">
                           <textarea 
                             className="glass-input w-full p-3 h-24 rounded-lg text-sm resize-none leading-relaxed border-white/10"
                             value={scene.action || ''}
                             onChange={(e) => setScenes(prev => prev.map(s => s.id === scene.id ? { ...s, action: e.target.value } : s))}
                             placeholder="Action or edit modifier..."
                           />
                           
                           {/* Action Visual Thumbnails */}
                           <div className="relative w-full h-32 rounded-lg bg-black/40 border border-white/5 flex items-center justify-center overflow-hidden">
                               {scene.actionVideoUrl ? (
                                  <>
                                    <video src={scene.actionVideoUrl} className="absolute inset-0 w-full h-full object-cover" />
                                    <div 
                                      className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer hover:bg-black/20 transition"
                                      onClick={() => openLightbox(scene.actionVideoUrl!, 'video')}
                                    >
                                      <Play className="w-8 h-8 text-[#FFC423] drop-shadow-md" />
                                    </div>
                                  </>
                               ) : scene.actionImageUrl ? (
                                  <img 
                                    src={scene.actionImageUrl} 
                                    className="w-full h-full object-cover cursor-zoom-in hover:brightness-110 transition border-[2px] border-purple-500/50"
                                    onClick={() => openLightbox(scene.actionImageUrl!, 'image')}
                                    alt="Action visual"
                                  />
                               ) : (
                                  <div className="text-zinc-600 text-xs italic flex flex-col items-center gap-1">
                                     <Edit className="w-4 h-4 opacity-50" />
                                     Requires Base Image
                                  </div>
                               )}
                           </div>
                           
                           <div className="flex gap-2">
                             <button 
                               disabled={!scene.imageUrl || scene.actionStatus === 'generating' || !scene.action}
                               onClick={() => handleGenerateActionImage(scene.id, scene.action, scene.imageUrl!)}
                               className="glass-button flex-1 px-2 py-2 rounded text-xs text-purple-300 font-semibold border-purple-500/30 flex items-center justify-center gap-1 disabled:opacity-30"
                             >
                                {scene.actionStatus === 'generating' ? <Loader2 className="animate-spin w-3 h-3"/> : <Edit className="w-3 h-3"/>}
                                {scene.actionImageUrl ? 'Redo Edit' : 'Edit Base Image'}
                             </button>
                             <button 
                               disabled={!scene.actionImageUrl || ['pending','processing'].includes(scene.actionVideoStatus || '')}
                               onClick={() => handleGenerateVideo(scene.id, scene.description, scene.actionImageUrl!, true)}
                               className="glass-button flex-1 px-2 py-2 rounded text-xs text-[#FFC423] font-semibold border-[#FFC423]/30 flex items-center justify-center gap-1 disabled:opacity-30"
                             >
                                {['pending','processing'].includes(scene.actionVideoStatus || '') ? <Loader2 className="animate-spin w-3 h-3"/> : <Play className="w-3 h-3"/>}
                                {scene.actionVideoUrl ? 'Redo Action' : 'Action Video'}
                             </button>
                           </div>
                         </div>
                       </td>

                       {/* Dialogue & Audio */}
                       <td className="p-4 align-top">
                          <div className="flex flex-col gap-3 h-full">
                            <textarea 
                             className="glass-input w-full p-3 h-24 rounded-lg text-sm resize-none leading-relaxed border-white/10"
                             value={scene.dialogue || ''}
                             onChange={(e) => setScenes(prev => prev.map(s => s.id === scene.id ? { ...s, dialogue: e.target.value } : s))}
                             placeholder="Dialogue text..."
                            />
                            
                            <div className="w-full h-32 rounded-lg bg-black/20 border border-white/5 flex flex-col items-center justify-center p-2">
                               {scene.audioUrl ? (
                                 <audio controls src={scene.audioUrl} className="w-full" />
                               ) : (
                                 <div className="text-zinc-600 text-xs italic flex items-center gap-1">
                                    <Volume2 className="w-4 h-4 opacity-50"/> No audio Track
                                 </div>
                               )}
                            </div>
                            
                            <button 
                              disabled={scene.audioStatus === 'generating' || !scene.dialogue || scene.dialogue.toLowerCase().includes('silence')}
                              onClick={() => handleGenerateAudio(scene.id, scene.dialogue)}
                              className="glass-button w-full px-2 py-2 rounded text-xs text-white flex items-center justify-center gap-1 disabled:opacity-50"
                            >
                               {scene.audioStatus === 'generating' ? <Loader2 className="animate-spin w-3 h-3"/> : <Volume2 className="w-3 h-3"/>}
                               {scene.audioUrl ? 'Regenerate Audio' : 'Generate Audio'}
                            </button>
                          </div>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </div>
        )}
      </main>

      {/* Lightbox Overlay */}
      {lightboxOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-sm" 
          onClick={() => setLightboxOpen(false)}
        >
           <div className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center" onClick={e => e.stopPropagation()}>
             <button 
               className="absolute -top-12 right-0 text-white hover:text-purple-400 p-2 font-bold text-xl transition-colors" 
               onClick={() => setLightboxOpen(false)}
             >
               ✕ Close
             </button>
             {lightboxType === 'image' ? (
               <img src={lightboxUrl} className="max-w-full max-h-[85vh] rounded-lg shadow-2xl border border-white/10" alt="Full size" />
             ) : (
               <video src={lightboxUrl} controls autoPlay className="max-w-full max-h-[85vh] rounded-lg shadow-2xl border border-white/10" />
             )}
           </div>
        </div>
      )}
    </div>
  );
}

export default App;
