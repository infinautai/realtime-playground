import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Slider } from "@/components/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

export interface PanelSettings {
  voice: string;
  turnDetection: string | undefined;
  threshold: number;
  prefixPadding: number;
  silenceDuration: number;
  model: string;
  transcriptModel: string;
  noiseReduction: string;
  temperature: number;
  maxTokens: number;
  systemInstructions: string;
}

interface SettingsPanelProps {
  onSettingsChange: (settings: PanelSettings) => void;
  defaultSettings: PanelSettings;
}

export const SettingsPanel = ({ onSettingsChange, defaultSettings }: SettingsPanelProps) => {
  const [settings, setSettings] = useState<PanelSettings>(defaultSettings);
  const [isClient, setIsClient] = useState(false);


  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined') {
      try {
        const savedSettings = localStorage.getItem('sessionSettings');
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          setSettings(parsed);
        }
      } catch (error) {
        console.error('Error loading settings from localStorage:', error);
      }
    }
  }, []);

  const handleChange = (key: string, value: string | number) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    onSettingsChange(newSettings);
 
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('sessionSettings', JSON.stringify(newSettings));
      } catch (error) {
        console.error('Error saving settings to localStorage:', error);
      }
    }
  };

  if (!isClient) {
    return <div className="h-full bg-background p-6 overflow-y-auto" />;
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.3
      }
    }
  };

  return (
    <motion.div 
      className="h-full bg-background p-6 overflow-y-auto"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="space-y-6">
        {/* System instructions */}
        <div>
          <h3 className="text-sm font-medium mb-2">System instructions</h3>
          <Textarea
            value={settings.systemInstructions}
            onChange={(e) => handleChange('systemInstructions', e.target.value)}
            placeholder="Please enter the system instructions"
            className="min-h-[200px]"
          />
        </div>

        {/* Voice activity detection */}
        <div>
          <h3 className="text-sm font-medium mb-2">Automatic turn detection</h3>
          <Tabs 
            value={settings.turnDetection || 'Normal'} 
            onValueChange={(value) => handleChange('turnDetection', value)}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="Normal">Normal</TabsTrigger>
              <TabsTrigger value="Disabled">Disabled</TabsTrigger>
            </TabsList>
            <AnimatePresence mode="wait">
              {settings.turnDetection === 'Normal' ? (
                <motion.div
                  key="normal"
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                >
                  <TabsContent value="Normal" className="space-y-6 mt-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-medium">Threshold</h3>
                        <span className="text-sm text-muted-foreground">{settings.threshold}</span>
                      </div>
                      <Slider
                        min={0}
                        max={1}
                        step={0.01}
                        value={[settings.threshold]}
                        onValueChange={([value]) => handleChange('threshold', value)}
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-medium">Prefix padding</h3>
                        <span className="text-sm text-muted-foreground">{settings.prefixPadding}ms</span>
                      </div>
                      <Slider
                        min={0}
                        max={1000}
                        step={10}
                        value={[settings.prefixPadding]}
                        onValueChange={([value]) => handleChange('prefixPadding', value)}
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-medium">Silence duration</h3>
                        <span className="text-sm text-muted-foreground">{settings.silenceDuration}ms</span>
                      </div>
                      <Slider
                        min={100}
                        max={2000}
                        step={10}
                        value={[settings.silenceDuration]}
                        onValueChange={([value]) => handleChange('silenceDuration', value)}
                      />
                    </div>
                  </TabsContent>
                </motion.div>
              ) : (
                <motion.div
                  key="disabled"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="mt-4 text-sm text-muted-foreground"
                >
                  Turn detection is disabled. The system will not automatically detect speech turns.
                </motion.div>
              )}
            </AnimatePresence>
          </Tabs>
        </div>

        <div>
          <h3 className="text-sm font-medium mb-2">Model</h3>
          <Select
            value={settings.model}
            onValueChange={(value) => handleChange('model', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="qwen2.5-omni-3b">qwen2.5-omni-3b</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <h3 className="text-sm font-medium mb-2">User transcript model</h3>
          <Select
            value={settings.transcriptModel}
            onValueChange={(value) => handleChange('transcriptModel', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select transcript model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="whisper-large">whisper-large</SelectItem>
              <SelectItem value="whisper-medium">whisper-medium</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <h3 className="text-sm font-medium mb-2">Noise reduction</h3>
          <Select
            value={settings.noiseReduction}
            onValueChange={(value) => handleChange('noiseReduction', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select noise reduction" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="None">None</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardContent className="pt-6">
            <h3 className="text-sm font-medium mb-4">Model configuration</h3>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm text-muted-foreground">Temperature</h4>
                  <span className="text-sm text-muted-foreground">{settings.temperature}</span>
                </div>
                <Slider
                  min={0}
                  max={1}
                  step={0.1}
                  value={[settings.temperature]}
                  onValueChange={([value]) => handleChange('temperature', value)}
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm text-muted-foreground">Max tokens</h4>
                  <span className="text-sm text-muted-foreground">{settings.maxTokens}</span>
                </div>
                <Slider
                  min={1000}
                  max={8000}
                  step={100}
                  value={[settings.maxTokens]}
                  onValueChange={([value]) => handleChange('maxTokens', value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}; 