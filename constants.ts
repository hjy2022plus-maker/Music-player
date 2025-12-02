import { Album, Song } from './types';

export const MOCK_ALBUMS: Album[] = [
  {
    id: 'a1',
    title: 'Midnights',
    artist: 'Taylor Swift',
    cover: 'https://picsum.photos/id/10/400/400',
    year: '2022',
    accentColor: '#383654', // Dark Blue/Purple
    songs: [
      { id: 's1', title: 'Lavender Haze', artist: 'Taylor Swift', album: 'Midnights', cover: 'https://picsum.photos/id/10/400/400', duration: '3:22', accentColor: '#383654' },
      { id: 's2', title: 'Maroon', artist: 'Taylor Swift', album: 'Midnights', cover: 'https://picsum.photos/id/10/400/400', duration: '3:38', accentColor: '#383654' },
      { id: 's3', title: 'Anti-Hero', artist: 'Taylor Swift', album: 'Midnights', cover: 'https://picsum.photos/id/10/400/400', duration: '3:20', accentColor: '#383654' },
    ]
  },
  {
    id: 'a2',
    title: 'Harry\'s House',
    artist: 'Harry Styles',
    cover: 'https://picsum.photos/id/12/400/400',
    year: '2022',
    accentColor: '#4a6fa5', // Denim Blue
    songs: [
      { id: 's4', title: 'Music For a Sushi Restaurant', artist: 'Harry Styles', album: 'Harry\'s House', cover: 'https://picsum.photos/id/12/400/400', duration: '3:14', accentColor: '#4a6fa5' },
      { id: 's5', title: 'Late Night Talking', artist: 'Harry Styles', album: 'Harry\'s House', cover: 'https://picsum.photos/id/12/400/400', duration: '2:58', accentColor: '#4a6fa5' },
      { id: 's6', title: 'As It Was', artist: 'Harry Styles', album: 'Harry\'s House', cover: 'https://picsum.photos/id/12/400/400', duration: '2:47', accentColor: '#4a6fa5' },
    ]
  },
  {
    id: 'a3',
    title: 'Renaissance',
    artist: 'Beyoncé',
    cover: 'https://picsum.photos/id/18/400/400',
    year: '2022',
    accentColor: '#787878', // Metallic/Grey
    songs: [
      { id: 's7', title: 'I\'M THAT GIRL', artist: 'Beyoncé', album: 'Renaissance', cover: 'https://picsum.photos/id/18/400/400', duration: '3:28', accentColor: '#787878' },
      { id: 's8', title: 'COZY', artist: 'Beyoncé', album: 'Renaissance', cover: 'https://picsum.photos/id/18/400/400', duration: '3:30', accentColor: '#787878' },
    ]
  },
  {
    id: 'a4',
    title: 'Special',
    artist: 'Lizzo',
    cover: 'https://picsum.photos/id/20/400/400',
    year: '2022',
    accentColor: '#8a1c46', // Deep Magenta
    songs: [
      { id: 's9', title: 'About Damn Time', artist: 'Lizzo', album: 'Special', cover: 'https://picsum.photos/id/20/400/400', duration: '3:11', accentColor: '#8a1c46' },
    ]
  },
  {
    id: 'a5',
    title: 'Un Verano Sin Ti',
    artist: 'Bad Bunny',
    cover: 'https://picsum.photos/id/25/400/400',
    year: '2022',
    accentColor: '#df4635', // Vibrant Red/Orange
    songs: [
      { id: 's10', title: 'Moscow Mule', artist: 'Bad Bunny', album: 'Un Verano Sin Ti', cover: 'https://picsum.photos/id/25/400/400', duration: '4:05', accentColor: '#df4635' },
    ]
  }
];

export const MOCK_HITS: Song[] = MOCK_ALBUMS.flatMap(a => a.songs).sort(() => Math.random() - 0.5);

export const ACCENT_COLOR = 'text-rose-500';
// Background constants are removed in favor of dynamic classes, but keeping these for fallback reference if needed
export const BG_COLOR = 'bg-[#1e1e1e]'; 
export const SIDEBAR_COLOR = 'bg-[#181818]'; 
export const BORDER_COLOR = 'border-[#2c2c2c]';