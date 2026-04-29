import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Trash2, Search, RefreshCw } from "lucide-react";
import { useToast } from "./ui/Toast";

interface Transcription {
  id: number;
  timestamp: string;
  original_text: string;
  processed_text?: string;
  is_processed: boolean;
}

interface HistoryPanelProps {
  className?: string;
  maxItems?: number;
}

export default function HistoryPanel({
  className = "",
  maxItems = 50,
}: HistoryPanelProps) {
  const [history, setHistory] = useState<Transcription[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<Transcription[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Load transcription history
  const loadHistory = async () => {
    try {
      setIsLoading(true);
      const transcriptions = await window.electronAPI.getTranscriptions(maxItems);
      setHistory(transcriptions || []);
      setFilteredHistory(transcriptions || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load transcription history",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Search/filter history
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredHistory(history);
      return;
    }
    const filtered = history.filter(
      (item) =>
        item.original_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.processed_text &&
          item.processed_text.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    setFilteredHistory(filtered);
  }, [searchQuery, history]);

  // Load history on mount
  useEffect(() => {
    loadHistory();
  }, []);

  // Delete single transcription
  const handleDelete = async (id: number) => {
    try {
      await window.electronAPI.deleteTranscription(id);
      setHistory((prev) => prev.filter((item) => item.id !== id));
      toast({
        title: "Deleted",
        description: "Transcription removed from history",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete transcription",
        variant: "destructive",
      });
    }
  };

  // Clear all history
  const handleClearAll = async () => {
    try {
      await window.electronAPI.clearTranscriptions();
      setHistory([]);
      toast({
        title: "Cleared",
        description: "All transcription history deleted",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear history",
        variant: "destructive",
      });
    }
  };

  // Format timestamp
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  // Truncate text
  const truncate = (text: string, maxLength = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <Card className={`${className} bg-gray-900 border-gray-700`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">Transcription History</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadHistory}
            className="text-gray-400 hover:text-white"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search transcriptions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
          />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center text-gray-400 py-8">Loading history...</div>
        ) : filteredHistory.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            {searchQuery ? "No matching transcriptions" : "No transcription history yet"}
          </div>
        ) : (
          <>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredHistory.map((item) => (
                <div
                  key={item.id}
                  className="bg-gray-800 rounded-lg p-3 hover:bg-gray-750 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm">
                        {truncate(item.processed_text || item.original_text)}
                      </p>
                      <p className="text-gray-400 text-xs mt-1">
                        {formatTime(item.timestamp)}
                        {item.is_processed && (
                          <span className="ml-2 text-blue-400">AI Enhanced</span>
                        )}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(item.id)}
                      className="text-gray-400 hover:text-red-400 flex-shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            {history.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleClearAll}
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All History
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
