import React from 'react';
import { useForm, SubmitHandler, FieldValues } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Label } from "@/components/ui/label";
import { CreativeTabs, CreativeTabsContent, CreativeTabsList, CreativeTabsTrigger } from "@/components/CreativeTabs/CreativeTabs";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreativeButton } from "@/components/CreativeButton/CreativeButton";
import { CreativeInput } from "@/components/CreativeInput/CreativeInput";
import { CreativeCard } from "@/components/CreativeCard/CreativeCard";
import { TextRotate } from "@/components/ui/text-rotate";
import logger from '@/lib/logger';

// Define the structure of the form data (can be shared or re-defined)
export interface OnboardingFormData extends FieldValues {
  displayName: string;
  gameId?: string;
  action: 'create' | 'join';
}

// Define the component props (same as original Onboarding)
interface OnboardingFormProps {
  onSubmit: SubmitHandler<OnboardingFormData>;
  isLoading: boolean;
  error?: string | null;
}

export const OnboardingForm: React.FC<OnboardingFormProps> = ({ onSubmit, isLoading, error }) => {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    trigger,
  } = useForm<OnboardingFormData>({
    defaultValues: {
      displayName: '',
      gameId: '',
      action: 'create',
    },
    mode: 'onChange',
  });

  const activeTab = watch('action');

  const handleFormSubmit: SubmitHandler<FieldValues> = (data) => {
    const formData: OnboardingFormData = {
      ...data,
      action: activeTab,
      displayName: data.displayName.trim(),
      gameId: activeTab === 'join' ? data.gameId?.trim() : undefined,
    };
    logger.debug('Onboarding form submitted with data:', formData);
    onSubmit(formData);
  };

  return (
    // Motion div and CreativeCard wrapper contain the form elements
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
      className="relative z-10 w-full max-w-md group p-4" // Keep padding here for spacing within the card
    >
      <CreativeCard>
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold tracking-tight flex justify-center items-center min-h-[5rem] font-handwritten">
            <span className="mr-2">Welcome to</span>
            <TextRotate
              texts={["Songer", "the Music Game", "the Challenge!"]}
              rotationInterval={2500}
              mainClassName="text-primary"
              staggerDuration={0.02}
              transition={{ type: "spring", damping: 15, stiffness: 200 }}
            />
          </CardTitle>
          <CardDescription className="font-handwritten">Create or join a game to start playing</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            {/* Shared Display Name Input */}
            <div className="space-y-2">
              <Label htmlFor="displayName" className="font-handwritten block mb-1">Display Name</Label>
              <CreativeInput
                id="displayName"
                placeholder="Enter your display name"
                aria-invalid={errors.displayName ? "true" : "false"}
                aria-describedby="displayNameError"
                {...register('displayName', { required: 'Display name is required.' })}
              />
              {errors.displayName && (
                <p id="displayNameError" className="text-sm text-destructive" role="alert">
                  {errors.displayName?.message}
                </p>
              )}
            </div>

            <CreativeTabs
               defaultValue="create"
               className="w-full"
               onValueChange={(value: string) => {
                  setValue('action', value as 'create' | 'join');
                  if (value === 'join') {
                      trigger('gameId');
                  }
               }}
            >
              <CreativeTabsList className="grid w-full grid-cols-2">
                <CreativeTabsTrigger value="create">Create Game</CreativeTabsTrigger>
                <CreativeTabsTrigger value="join">Join Game</CreativeTabsTrigger>
              </CreativeTabsList>

              {/* Create Game Tab */}
              <CreativeTabsContent value="create" className="space-y-4 pt-4">
                <p className="text-sm text-muted-foreground text-center font-handwritten">
                  Start a new game session and invite friends.
                </p>
                <CreativeButton
                  type="submit"
                  className="w-full h-12 bg-amber-400 text-zinc-900 hover:bg-amber-300 active:bg-amber-400"
                  disabled={isLoading}
                >
                  {isLoading && activeTab === 'create' ? 'Creating...' : 'Create Game'}
                </CreativeButton>
              </CreativeTabsContent>

              {/* Join Game Tab */}
              <CreativeTabsContent value="join" className="space-y-4 pt-4">
                <p className="text-sm text-muted-foreground text-center font-handwritten">
                  Enter the ID of an existing game to join.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="gameId" className="font-handwritten block mb-1">Game ID</Label>
                  <CreativeInput
                    id="gameId"
                    placeholder="Enter game ID (e.g., XYZ123)"
                    aria-invalid={errors.gameId ? "true" : "false"}
                    aria-describedby="gameIdError"
                    {...register('gameId', {
                      required: activeTab === 'join' ? 'Game ID is required to join.' : false,
                    })}
                  />
                  {errors.gameId && activeTab === 'join' && (
                    <p id="gameIdError" className="text-sm text-destructive" role="alert">
                      {errors.gameId?.message}
                    </p>
                  )}
                </div>
                <CreativeButton
                  type="submit"
                  className="w-full h-12 bg-amber-400 text-zinc-900 hover:bg-amber-300 active:bg-amber-400"
                  disabled={isLoading}
                >
                   {isLoading && activeTab === 'join' ? 'Joining...' : 'Join Game'}
                </CreativeButton>
              </CreativeTabsContent>
            </CreativeTabs>

             {/* Display general form error from parent */}
             {error && (
                <p className="text-sm text-destructive text-center pt-2" role="alert">
                  {error}
                </p>
              )}
          </form>
        </CardContent>
       </CreativeCard>
     </motion.div>
  );
};