import { createBrowserRouter } from 'react-router-dom';
import { Layout } from './components/Layout';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        lazy: () => import('./pages/HomePage').then((m) => ({ Component: m.HomePage })),
      },
      {
        path: 'como-funciona',
        lazy: () => import('./pages/ComoFuncionaPage').then((m) => ({ Component: m.ComoFuncionaPage })),
      },
      {
        path: 'explorar',
        lazy: () => import('./pages/ExplorarPage').then((m) => ({ Component: m.ExplorarPage })),
      },
      {
        path: 'artist/:id',
        lazy: () => import('./pages/ArtistPage').then((m) => ({ Component: m.ArtistPage })),
      },
      {
        path: 'pool/:id',
        lazy: () => import('./pages/PoolPage').then((m) => ({ Component: m.PoolPage })),
      },
      {
        path: '*',
        lazy: () => import('./pages/NotFoundPage').then((m) => ({ Component: m.NotFoundPage })),
      },
    ],
  },
]);
