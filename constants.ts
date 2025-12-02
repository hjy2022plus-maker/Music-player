import { Album, Song } from './types';

export const MOCK_ALBUMS: Album[] = [
  {
    id: 'a1',
    title: 'Midnights',
    artist: 'Taylor Swift',
    cover: 'https://picsum.photos/id/10/400/400',
    year: '2022',
    songs: [
      { id: 's1', title: 'Lavender Haze', artist: 'Taylor Swift', album: 'Midnights', cover: 'https://picsum.photos/id/10/400/400', duration: '3:22' },
      { id: 's2', title: 'Maroon', artist: 'Taylor Swift', album: 'Midnights', cover: 'https://picsum.photos/id/10/400/400', duration: '3:38' },
      { id: 's3', title: 'Anti-Hero', artist: 'Taylor Swift', album: 'Midnights', cover: 'https://picsum.photos/id/10/400/400', duration: '3:20' },
    ]
  },
  {
    id: 'a2',
    title: 'Harry\'s House',
    artist: 'Harry Styles',
    cover: 'https://picsum.photos/id/12/400/400',
    year: '2022',
    songs: [
      { id: 's4', title: 'Music For a Sushi Restaurant', artist: 'Harry Styles', album: 'Harry\'s House', cover: 'https://picsum.photos/id/12/400/400', duration: '3:14' },
      { id: 's5', title: 'Late Night Talking', artist: 'Harry Styles', album: 'Harry\'s House', cover: 'https://picsum.photos/id/12/400/400', duration: '2:58' },
      { id: 's6', title: 'As It Was', artist: 'Harry Styles', album: 'Harry\'s House', cover: 'https://picsum.photos/id/12/400/400', duration: '2:47' },
    ]
  },
  {
    id: 'a3',
    title: 'Renaissance',
    artist: 'Beyoncé',
    cover: 'https://picsum.photos/id/18/400/400',
    year: '2022',
    songs: [
      { id: 's7', title: 'I\'M THAT GIRL', artist: 'Beyoncé', album: 'Renaissance', cover: 'https://picsum.photos/id/18/400/400', duration: '3:28' },
      { id: 's8', title: 'COZY', artist: 'Beyoncé', album: 'Renaissance', cover: 'https://picsum.photos/id/18/400/400', duration: '3:30' },
    ]
  },
  {
    id: 'a4',
    title: 'Special',
    artist: 'Lizzo',
    cover: 'https://picsum.photos/id/20/400/400',
    year: '2022',
    songs: [
      { id: 's9', title: 'About Damn Time', artist: 'Lizzo', album: 'Special', cover: 'https://picsum.photos/id/20/400/400', duration: '3:11' },
    ]
  },
  {
    id: 'a5',
    title: 'Un Verano Sin Ti',
    artist: 'Bad Bunny',
    cover: 'https://picsum.photos/id/25/400/400',
    year: '2022',
    songs: [
      { id: 's10', title: 'Moscow Mule', artist: 'Bad Bunny', album: 'Un Verano Sin Ti', cover: 'https://picsum.photos/id/25/400/400', duration: '4:05' },
    ]
  }
];

export const MOCK_HITS: Song[] = MOCK_ALBUMS.flatMap(a => a.songs).sort(() => Math.random() - 0.5);

export const ACCENT_COLOR = 'text-rose-500';
export const BG_COLOR = 'bg-[#1e1e1e]'; // Dark mode base
export const SIDEBAR_COLOR = 'bg-[#181818]'; // Slightly darker
export const BORDER_COLOR = 'border-[#2c2c2c]';
