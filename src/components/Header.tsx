import { Link } from 'react-router-dom';
import { Globe, LogOut, ShoppingBag, MessageSquare, LayoutDashboard, Sprout, Plus, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';

export function Header() {
  const { language, setLanguage, t } = useLanguage();
  const { user, signOut, userRole } = useAuth();

  const isFarmer = userRole === 'farmer';
  const isAdmin = userRole === 'admin';
  const isBuyer = userRole === 'buyer';

  return (
    <header className={`sticky top-0 z-40 w-full border-b backdrop-blur supports-[backdrop-filter]:bg-card/60 ${isAdmin ? 'bg-amber-50/95 border-amber-200' : 'bg-card/95'}`}>
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl">
          <span className="text-2xl">🌾</span>
          <span className="bg-gradient-primary bg-clip-text text-transparent">
            {t('appName')}
          </span>
          {isAdmin && <span className="text-xs bg-amber-500 text-white px-2 py-0.5 rounded ml-2">Admin</span>}
        </Link>

        <nav className="flex items-center gap-2 md:gap-4">
          {user && (
            <>
              {/* Bazaar/Browse - All roles can see */}
              <Link to="/marketplace">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ShoppingBag className="h-4 w-4" />
                  <span className="hidden sm:inline">{t('marketplace')}</span>
                </Button>
              </Link>

              {/* Farmer only: My Crops & Add Crop */}
              {isFarmer && (
                <>
                  <Link to="/my-crops">
                    <Button variant="ghost" size="sm" className="gap-2">
                      <Sprout className="h-4 w-4" />
                      <span className="hidden sm:inline">{t('myCrops')}</span>
                    </Button>
                  </Link>
                  <Link to="/add-crop">
                    <Button variant="ghost" size="sm" className="gap-2">
                      <Plus className="h-4 w-4" />
                      <span className="hidden sm:inline">{t('addCrop')}</span>
                    </Button>
                  </Link>
                </>
              )}

              {/* Chat - All roles */}
              <Link to="/chat">
                <Button variant="ghost" size="sm" className="gap-2">
                  <MessageSquare className="h-4 w-4" />
                  <span className="hidden sm:inline">{t('chat')}</span>
                </Button>
              </Link>

              {/* Orders - context depends on role */}
              <Link to="/orders">
                <Button variant="ghost" size="sm" className="gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  <span className="hidden sm:inline">{t('myOrders')}</span>
                </Button>
              </Link>

              {/* Farmer Dashboard shortcut */}
              {isFarmer && (
                <Link to="/farmer-dashboard">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Sprout className="h-4 w-4" />
                    <span className="hidden sm:inline">{t('dashboard')}</span>
                  </Button>
                </Link>
              )}

              {/* Admin Dashboard */}
              {isAdmin && (
                <Link to="/admin">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Shield className="h-4 w-4" />
                    <span className="hidden sm:inline">{t('admin')}</span>
                  </Button>
                </Link>
              )}
            </>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <Globe className="h-4 w-4" />
                {language.toUpperCase()}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setLanguage('en')}>
                English
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage('hi')}>
                हिंदी
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage('te')}>
                తెలుగు
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage('kn')}>
                ಕನ್ನಡ
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {user && (
            <Button variant="ghost" size="sm" onClick={signOut} className="gap-2">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">{t('logout')}</span>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
