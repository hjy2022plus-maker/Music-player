import React from 'react';
import { Home, Grid, Radio, Music, Clock, User, Disc, Search, Sparkles } from 'lucide-react';
import { View } from '../types';
import { ACCENT_COLOR } from '../constants';

interface SidebarProps {
  currentView: View;
  onChangeView: (view: View) => void;
  onSearch: (term: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, onSearch }) => {
  const [searchTerm, setSearchTerm] = React.useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchTerm);
  };

  const NavItem = ({ view, icon: Icon, label }: { view: View; icon: React.ElementType; label: string }) => {
    const isActive = currentView === view;
    return (
      <button
        onClick={() => onChangeView(view)}
        className={`w-full flex items-center gap-3 px-4 py-2 rounded-md transition-colors text-sm font-medium ${
          isActive 
            ? `${ACCENT_COLOR} bg-white/10` 
            : 'text-gray-400 hover:text-white hover:bg-white/5'
        }`}
      >
        <Icon size={18} className={isActive ? ACCENT_COLOR : 'text-gray-400'} />
        {label}
      </button>
    );
  };

  return (
    <aside className="w-64 flex-shrink-0 flex flex-col h-full bg-black/20 backdrop-blur-xl border-r border-white/5 pt-8 px-4 z-20">
      <div className="mb-6 px-2">
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="absolute left-3 top-2.5 text-gray-500" size={16} />
          <input
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/10 text-white pl-10 pr-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-rose-500 placeholder-gray-400 border border-transparent focus:border-white/10"
          />
        </form>
      </div>

      <div className="space-y-1 mb-8">
        <NavItem view={View.HOME} icon={Home} label="Listen Now" />
        <NavItem view={View.BROWSE} icon={Grid} label="Browse" />
        <NavItem view={View.RADIO} icon={Radio} label="Radio" />
      </div>

      <div className="px-4 mb-2">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Library</h3>
      </div>
      <div className="space-y-1 mb-8">
        <button className="w-full flex items-center gap-3 px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm font-medium hover:bg-white/5 rounded-md">
           <Clock size={18} /> Recently Added
        </button>
        <button className="w-full flex items-center gap-3 px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm font-medium hover:bg-white/5 rounded-md">
           <User size={18} /> Artists
        </button>
        <button className="w-full flex items-center gap-3 px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm font-medium hover:bg-white/5 rounded-md">
           <Disc size={18} /> Albums
        </button>
        <button className="w-full flex items-center gap-3 px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm font-medium hover:bg-white/5 rounded-md">
           <Music size={18} /> Songs
        </button>
      </div>

      <div className="px-4 mb-2">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Playlists</h3>
      </div>
       <div className="space-y-1">
        <NavItem view={View.AI_DJ} icon={Sparkles} label="Ask Gemini DJ" />
       </div>

    </aside>
  );
};

export default Sidebar;