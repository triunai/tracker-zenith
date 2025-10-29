import React from 'react';
import { LoginForm } from '@/components/auth/LoginForm';
import Squares from '@/components/ui/Squares';

const Login: React.FC = () => {
  return (
    <div className="relative flex h-screen w-screen flex-col items-center justify-center overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 z-0">
        <Squares 
          speed={0.5} 
          squareSize={40}
          direction='diagonal'
          borderColor='rgba(133, 139, 173, 0.5)' // #858bad at 50% opacity
          hoverFillColor='rgba(133, 139, 173, 0.6)' // #858bad brighter on hover
        />
      </div>
      
      {/* Content */}
      <div className="container relative z-10 mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="text-sm text-muted-foreground">
            Enter your credentials to sign in to your account
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
};

export default Login; 