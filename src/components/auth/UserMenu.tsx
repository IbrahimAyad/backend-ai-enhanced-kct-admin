import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { AuthModal } from './AuthModal';
import { SavedOutfitsModal } from '@/components/outfits/SavedOutfitsModal';
import { CreateWeddingModal } from '@/components/wedding/CreateWeddingModal';
import { User, Settings, Package, Heart, LogOut, ShoppingBag, Crown } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';

export function UserMenu() {
  const { user, profile, signOut } = useAuth();
  const { getItemCount } = useCart();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'signin' | 'signup'>('signin');

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => {
            setAuthModalTab('signin');
            setShowAuthModal(true);
          }}
        >
          Sign In
        </Button>
        <Button 
          size="sm"
          onClick={() => {
            setAuthModalTab('signup');
            setShowAuthModal(true);
          }}
        >
          Sign Up
        </Button>
        <AuthModal 
          open={showAuthModal} 
          onOpenChange={setShowAuthModal} 
          defaultTab={authModalTab}
        />
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={profile?.avatar_url} alt={profile?.display_name || user.email} />
            <AvatarFallback>
              {getInitials(profile?.display_name || user.email)}
            </AvatarFallback>
          </Avatar>
          {getItemCount() > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-xs text-primary-foreground flex items-center justify-center">
              {getItemCount()}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {profile?.display_name || 'User'}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Package className="mr-2 h-4 w-4" />
          <span>Orders</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Heart className="mr-2 h-4 w-4" />
          <span>Wishlist</span>
        </DropdownMenuItem>
        <SavedOutfitsModal>
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <Package className="mr-2 h-4 w-4" />
            <span>Saved Outfits</span>
          </DropdownMenuItem>
        </SavedOutfitsModal>
        <CreateWeddingModal>
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <Crown className="mr-2 h-4 w-4" />
            <span>Wedding Management</span>
          </DropdownMenuItem>
        </CreateWeddingModal>
        <DropdownMenuItem>
          <ShoppingBag className="mr-2 h-4 w-4" />
          <span>Cart ({getItemCount()})</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}