import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Trash2, Plus, Edit2, Check, X } from "lucide-react";
import { useToast } from "./ui/Toast";

interface VocabularyEntry {
  id: string;
  original: string;  // What Whisper typically hears
  replacement: string;  // What it should be
  createdAt: string;
}

interface VocabularyEditorProps {
  className?: string;
}

export default function VocabularyEditor({ className = "" }: VocabularyEditorProps) {
  const [entries, setEntries] = useState<VocabularyEntry[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newOriginal, setNewOriginal] = useState("");
  const [newReplacement, setNewReplacement] = useState("");
  const { toast } = useToast();

  // Load vocabulary from localStorage
  useEffect(() => {
    loadVocabulary();
  }, []);

  const loadVocabulary = () => {
    try {
      const saved = localStorage.getItem("customVocabulary");
      if (saved) {
        setEntries(JSON.parse(saved));
      }
    } catch (error) {
      console.error("Failed to load vocabulary:", error);
    }
  };

  const saveVocabulary = (updated: VocabularyEntry[]) => {
    try {
      localStorage.setItem("customVocabulary", JSON.stringify(updated));
      setEntries(updated);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save vocabulary",
        variant: "destructive",
      });
    }
  };

  const handleAdd = () => {
    if (!newOriginal.trim() || !newReplacement.trim()) {
      toast({
        title: "Invalid input",
        description: "Both original and replacement are required",
        variant: "destructive",
      });
      return;
    }

    const newEntry: VocabularyEntry = {
      id: Date.now().toString(),
      original: newOriginal.trim(),
      replacement: newReplacement.trim(),
      createdAt: new Date().toISOString(),
    };

    const updated = [...entries, newEntry];
    saveVocabulary(updated);
    setNewOriginal("");
    setNewReplacement("");
    setIsAdding(false);

    toast({
      title: "Word added",
      description: `"${newOriginal}" will now be corrected to "${newReplacement}"`,
    });
  };

  const handleEdit = (entry: VocabularyEntry) => {
    setEditingId(entry.id);
    setNewOriginal(entry.original);
    setNewReplacement(entry.replacement);
  };

  const handleUpdate = () => {
    if (!newOriginal.trim() || !newReplacement.trim()) {
      toast({
        title: "Invalid input",
        description: "Both original and replacement are required",
        variant: "destructive",
      });
      return;
    }

    const updated = entries.map((e) =>
      e.id === editingId
        ? { ...e, original: newOriginal.trim(), replacement: newReplacement.trim() }
        : e
    );
    saveVocabulary(updated);
    setEditingId(null);
    setNewOriginal("");
    setNewReplacement("");

    toast({
      title: "Entry updated",
      description: "Your changes have been saved",
    });
  };

  const handleDelete = (id: string) => {
    const updated = entries.filter((e) => e.id !== id);
    saveVocabulary(updated);

    toast({
      title: "Entry deleted",
      description: "The vocabulary entry has been removed",
    });
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setNewOriginal("");
    setNewReplacement("");
  };

  return (
    <Card className={`${className} bg-gray-900 border-gray-700`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">Custom Vocabulary</CardTitle>
          <Button
            size="sm"
            onClick={() => setIsAdding(true)}
            disabled={isAdding || editingId !== null}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Add new entry form */}
        {isAdding && (
          <div className="mb-4 p-3 bg-gray-800 rounded-lg border border-gray-600">
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">
                  Misrecognized word (what Whisper hears)
                </label>
                <Input
                  placeholder='e.g., "ayush"'
                  value={newOriginal}
                  onChange={(e) => setNewOriginal(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">
                  Correct word (what it should be)
                </label>
                <Input
                  placeholder='e.g., "Ayush"'
                  value={newReplacement}
                  onChange={(e) => setNewReplacement(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleAdd}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancel}
                  className="border-gray-600 text-gray-300"
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Vocabulary list */}
        {entries.length === 0 && !isAdding ? (
          <div className="text-center text-gray-400 py-8">
            No custom vocabulary yet. Add words that Whisper misrecognizes!
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="p-3 bg-gray-800 rounded-lg border border-gray-600"
              >
                {editingId === entry.id ? (
                  <div className="space-y-3">
                    <Input
                      value={newOriginal}
                      onChange={(e) => setNewOriginal(e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                    <Input
                      value={newReplacement}
                      onChange={(e) => setNewReplacement(e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleUpdate}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Update
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancel}
                        className="border-gray-600 text-gray-300"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="text-white font-medium text-sm">
                          "{entry.original}" → "{entry.replacement}"
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(entry)}
                          className="text-gray-400 hover:text-white p-1"
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(entry.id)}
                          className="text-gray-400 hover:text-red-400 p-1"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Info */}
        <div className="mt-4 p-3 bg-gray-800 rounded-lg">
          <p className="text-xs text-gray-400">
            💡 Add words that Whisper frequently misrecognizes.
            For example, if Whisper keeps hearing "ayush" instead of "Ayush", add that here.
            The correction will be applied automatically after transcription.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
