import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, Home, Cable, Package, Users, Menu, X } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate, useLocation } from 'react-router-dom';
import { BlobSyncStatus } from './BlobSyncStatus';
import { cn } from '@/lib/utils';

const AppHeader = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
      setMobileMenuOpen(false);
    } catch (error) {
      toast.error('Error signing out');
    }
  };

  const initials = user?.user_metadata?.first_name && user?.user_metadata?.last_name
    ? `${user.user_metadata.first_name[0]}${user.user_metadata.last_name[0]}`.toUpperCase()
    : user?.email?.[0]?.toUpperCase() || 'U';

  const isActive = (path: string) => location.pathname === path;

  const handleNavigation = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/jobs', label: 'Jobs', icon: Cable },
    { path: '/inventory/equipment', label: 'Inventory', icon: Package },
    { path: '/contacts', label: 'Contacts', icon: Users },
  ];

  return (
    <header className="header-corporate px-4 sm:px-6 py-3 sm:py-4 safe-top">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 sm:space-x-6">
          {/* Mobile Menu Button */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden h-10 w-10"
                aria-label="Open menu"
              >
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] sm:w-[320px] p-0 bg-card border-border">
              <SheetHeader className="border-b border-border p-4">
                <SheetTitle className="text-left text-corporate-light">Navigation</SheetTitle>
              </SheetHeader>
              
              {/* Mobile User Info */}
              <div className="p-4 border-b border-border">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-accent-gold text-corporate-dark text-sm">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-corporate-light truncate">
                      {user?.user_metadata?.first_name && user?.user_metadata?.last_name
                        ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
                        : user?.email
                      }
                    </p>
                    {user?.user_metadata?.company && (
                      <p className="text-xs text-corporate-silver truncate">{user.user_metadata.company}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Mobile Navigation */}
              <nav className="flex flex-col p-4 space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Button
                      key={item.path}
                      variant={isActive(item.path) ? 'default' : 'ghost'}
                      className={cn(
                        "w-full justify-start h-12",
                        isActive(item.path) && "bg-accent-gold text-corporate-dark hover:bg-accent-gold-dark"
                      )}
                      onClick={() => handleNavigation(item.path)}
                    >
                      <Icon className="h-5 w-5 mr-3" />
                      {item.label}
                    </Button>
                  );
                })}
              </nav>

              {/* Mobile Sign Out */}
              <div className="p-4 border-t border-border mt-auto">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start h-12 text-status-danger hover:text-status-danger hover:bg-status-danger/10"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-5 w-5 mr-3" />
                  Sign Out
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          <h1 className="text-lg sm:text-xl font-semibold text-corporate-light uppercase tracking-wider truncate">
            Rig-Up Management
          </h1>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-2 lg:space-x-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.path}
                  variant={isActive(item.path) ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => navigate(item.path)}
                  className={cn(
                    "flex items-center gap-2",
                    isActive(item.path) && "bg-accent-gold text-corporate-dark hover:bg-accent-gold-dark"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden lg:inline">{item.label}</span>
                </Button>
              );
            })}
          </nav>
        </div>
        
        {/* Right side - Desktop only user info */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          <BlobSyncStatus className="hidden sm:block" />
          
          {/* Desktop User Info */}
          <div className="hidden md:flex items-center space-x-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-accent-gold text-corporate-dark">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden lg:block max-w-[150px] xl:max-w-[200px]">
              <p className="text-sm font-medium text-corporate-light truncate">
                {user?.user_metadata?.first_name && user?.user_metadata?.last_name
                  ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
                  : user?.email
                }
              </p>
              {user?.user_metadata?.company && (
                <p className="text-xs text-corporate-silver truncate">{user.user_metadata.company}</p>
              )}
            </div>
          </div>
          
          {/* Desktop Sign Out */}
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleSignOut}
            className="hidden md:flex h-9 w-9 text-corporate-silver hover:text-accent-gold"
            aria-label="Sign out"
          >
            <LogOut className="h-5 w-5" />
          </Button>

          {/* Mobile Sync Status and Avatar */}
          <div className="flex md:hidden items-center space-x-2">
            <BlobSyncStatus />
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-accent-gold text-corporate-dark text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;