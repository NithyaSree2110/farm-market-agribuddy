import { Link } from 'react-router-dom';
import { Globe, LogOut, ShoppingBag, MessageSquare, LayoutDashboard, Sprout } from 'lucide-react';
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
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl">
          <span className="text-2xl">🌾</span>
          <span className="bg-gradient-primary bg-clip-text text-transparent">
            {t('appName')}
          </span>
        </Link>

        <nav className="flex items-center gap-4">
          {user && (
            <>
              <Link to="/marketplace">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ShoppingBag className="h-4 w-4" />
                  {t('marketplace')}
                </Button>
              </Link>
              <Link to="/my-crops">
                <Button variant="ghost" size="sm" className="gap-2">
                  <Sprout className="h-4 w-4" />
                  {t('myCrops')}
                </Button>
              </Link>
              <Link to="/chat">
                <Button variant="ghost" size="sm" className="gap-2">
                  <MessageSquare className="h-4 w-4" />
                  {t('chat')}
                </Button>
              </Link>
              <Link to="/orders">
                <Button variant="ghost" size="sm" className="gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  {t('orders')}
                </Button>
              </Link>
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
            </DropdownMenuContent>
          </DropdownMenu>

          {user && (
            <Button variant="ghost" size="sm" onClick={signOut} className="gap-2">
              <LogOut className="h-4 w-4" />
              {t('logout')}
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}