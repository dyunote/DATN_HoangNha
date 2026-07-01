import { Outlet, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function MainLayout() {
  const { pathname } = useLocation();
  const isHome = pathname === '/';

  return (
    <>
      <Header />
      {isHome ? (
        <main className="flex-1 w-full">
          <Outlet />
        </main>
      ) : (
        <main className="flex-1 max-w-7xl w-full mx-auto px-6 sm:px-8 lg:px-12 pt-28 sm:pt-32 pb-20 sm:pb-24">
          <Outlet />
        </main>
      )}
      <Footer />
    </>
  );
}
