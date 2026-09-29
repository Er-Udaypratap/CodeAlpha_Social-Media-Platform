import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { Post } from '../types/index.ts';
import { Image, Hash, X, Sparkles, Send, Upload } from 'lucide-react';

interface PostComposerProps {
  onPostCreated: (post: Post) => void;
  onClose?: () => void;
  isModal?: boolean;
}

const PRESET_IMAGES = [
  {
    id: 'arch',
    label: 'Modern Architecture',
    url: '/src/assets/images/architecture_design_photo_1790571233620.jpg',
  },
  {
    id: 'nature',
    label: 'Alpine Sunrise',
    url: '/src/assets/images/nature_mountain_view_1790571251235.jpg',
  },
  {
    id: 'tech',
    label: 'Developer Studio',
    url: '/src/assets/images/technology_workspace_desk_1790571270751.jpg',
  },
  {
    id: 'coffee',
    label: 'Morning Pour-over',
    url: '/src/assets/images/culinary_coffee_art_1790571287506.jpg',
  },
];

const SUGGESTED_TAGS = ['design', 'tech', 'architecture', 'nature', 'coffee', 'photography', 'engineering'];

export const PostComposer: React.FC<PostComposerProps> = ({
  onPostCreated,
  onClose,
  isModal = false,
}) => {
  const { currentUser } = useAuth();
  const [content, setContent] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState('');
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleToggleTag = (tag: string) => {
    const clean = tag.replace('#', '').toLowerCase();
    if (selectedTags.includes(clean)) {
      setSelectedTags((prev) => prev.filter((t) => t !== clean));
    } else {
      setSelectedTags((prev) => [...prev, clean]);
    }
  };

  const handleAddCustomTag = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    const clean = customTagInput.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
    if (clean && !selectedTags.includes(clean)) {
      setSelectedTags((prev) => [...prev, clean]);
      setCustomTagInput('');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
      setShowImagePicker(false);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await api.createPost({
        content: content.trim(),
        imageUrl: selectedImage || undefined,
        tags: selectedTags,
      });

      setContent('');
      setSelectedImage(null);
      setSelectedTags([]);
      onPostCreated(res.post);
      if (onClose) {
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to publish post');
    } finally {
      setIsSubmitting(false);
    }
  };

  const maxChars = 500;
  const remainingChars = maxChars - content.length;

  if (!currentUser) return null;

  return (
    <div
      className={`rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 shadow-sm transition-all ${
        isModal ? 'max-w-xl w-full bg-neutral-900' : ''
      }`}
    >
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div className="flex gap-3">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            referrerPolicy="no-referrer"
            className="h-10 w-10 rounded-full object-cover border border-neutral-700 bg-neutral-800 shrink-0"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/identicon/svg?seed=${currentUser.username}`;
            }}
          />

          <div className="flex-1 min-w-0">
            <textarea
              placeholder="What's happening? Share thoughts, design insights, or photos..."
              value={content}
              onChange={(e) => {
                if (e.target.value.length <= maxChars) {
                  setContent(e.target.value);
                }
              }}
              rows={isModal ? 4 : 3}
              className="w-full resize-none bg-transparent text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none"
            />

            {/* Attached Image Preview */}
            {selectedImage && (
              <div className="relative mt-2 rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950 max-h-64">
                <img
                  src={selectedImage}
                  alt="Post attachment"
                  referrerPolicy="no-referrer"
                  className="w-full h-full max-h-64 object-cover"
                />
                <button
                  type="button"
                  onClick={() => setSelectedImage(null)}
                  className="absolute top-2 right-2 rounded-full bg-neutral-950/80 p-1.5 text-neutral-300 hover:text-white hover:bg-neutral-900 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Selected Tags list */}
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {selectedTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 text-xs text-indigo-400 bg-indigo-950/40 border border-indigo-900/60 rounded-md px-2 py-0.5"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleToggleTag(tag)}
                      className="text-neutral-400 hover:text-neutral-200"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Image Picker Dropdown */}
        {showImagePicker && (
          <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3 space-y-3">
            <div className="flex items-center justify-between text-xs text-neutral-400">
              <span className="font-semibold text-neutral-300">Choose Aesthetic Image</span>
              <button
                type="button"
                onClick={() => setShowImagePicker(false)}
                className="text-neutral-500 hover:text-neutral-300"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PRESET_IMAGES.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    setSelectedImage(preset.url);
                    setShowImagePicker(false);
                  }}
                  className={`group relative aspect-video rounded-lg overflow-hidden border transition-all ${
                    selectedImage === preset.url
                      ? 'border-indigo-500 ring-2 ring-indigo-500/20'
                      : 'border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <img
                    src={preset.url}
                    alt={preset.label}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-1.5">
                    <span className="text-[10px] text-white font-medium truncate">{preset.label}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-neutral-900 text-xs text-neutral-400">
              <span>Or upload your own image file</span>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium"
              >
                <Upload className="h-3.5 w-3.5" />
                Upload file
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>
        )}

        {/* Tag Quick Selector */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-neutral-500 pt-1 border-t border-neutral-800/60">
          <span className="text-[11px] text-neutral-500 mr-1">Suggested:</span>
          {SUGGESTED_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => handleToggleTag(tag)}
              className={`text-[11px] hover:text-indigo-400 transition-colors ${
                selectedTags.includes(tag) ? 'text-indigo-400 font-semibold' : 'text-neutral-400'
              }`}
            >
              #{tag}
            </button>
          ))}

          <div className="inline-flex items-center gap-1 ml-auto">
            <input
              type="text"
              placeholder="+ custom tag"
              value={customTagInput}
              onChange={(e) => setCustomTagInput(e.target.value)}
              onKeyDown={handleAddCustomTag}
              className="bg-transparent text-[11px] text-neutral-300 placeholder-neutral-600 focus:outline-none w-20 border-b border-neutral-800"
            />
          </div>
        </div>

        {error && <p className="text-xs text-rose-400">{error}</p>}

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowImagePicker((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                selectedImage || showImagePicker
                  ? 'bg-neutral-800 text-indigo-400'
                  : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'
              }`}
            >
              <Image className="h-4 w-4" />
              <span>{selectedImage ? 'Photo attached' : 'Add Photo'}</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`text-[11px] font-mono tabular-nums ${
                remainingChars < 20
                  ? 'text-rose-400'
                  : remainingChars < 60
                  ? 'text-amber-400'
                  : 'text-neutral-500'
              }`}
            >
              {remainingChars}
            </span>

            {isModal && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-3 py-1.5 text-xs text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{isSubmitting ? 'Posting...' : 'Post'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
