import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Trash2, Plus, Edit2, Check, X } from "lucide-react";
import { useToast } from "./ui/Toast";

interface Snippet {
  id: string;
  trigger: string;
  replacement: string;
  createdAt: string;
}

interface SnippetManagerProps {
  className?: string;
}

export default function SnippetManager({ className = "" }: SnippetManagerProps) {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTrigger, setNewTrigger] = useState("");
  const [newReplacement, setNewReplacement] = useState("");
  const { toast } = useToast();

  // Load snippets from localStorage
  useEffect(() => {
    loadSnippets();
  }, []);

  const loadSnippets = () => {
    try {
      const saved = localStorage.getItem("voiceSnippets");
      if (saved) {
        setSnippets(JSON.parse(saved));
      }
    } catch (error) {
      console.error("Failed to load snippets:", error);
    }
  };

  const saveSnippets = (updatedSnippets: Snippet[]) => {
    try {
      localStorage.setItem("voiceSnippets", JSON.stringify(updatedSnippets));
      setSnippets(updatedSnippets);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save snippets",
        variant: "destructive",
      });
    }
  };

  const handleAdd = () => {
    if (!newTrigger.trim() || !newReplacement.trim()) {
      toast({
        title: "Invalid input",
        description: "Both trigger and replacement text are required",
        variant: "destructive",
      });
      return;
    }

    // Check for duplicate trigger
    const duplicate = snippets.find(
      (s) => s.trigger.toLowerCase() === newTrigger.trim().toLowerCase()
    );
    if (duplicate) {
      toast({
        title: "Duplicate trigger",
        description: `"${newTrigger}" already exists as a trigger`,
        variant: "destructive",
      });
      return;
    }

    const newSnippet: Snippet = {
      id: Date.now().toString(),
      trigger: newTrigger.trim(),
      replacement: newReplacement.trim(),
      createdAt: new Date().toISOString(),
    };

    const updated = [...snippets, newSnippet];
    saveSnippets(updated);
    setNewTrigger("");
    setNewReplacement("");
    setIsAdding(false);

    toast({
      title: "Snippet added",
      description: `Trigger "${newTrigger}" will now expand to your text`,
    });
  };

  const handleEdit = (snippet: Snippet) => {
    setEditingId(snippet.id);
    setNewTrigger(snippet.trigger);
    setNewReplacement(snippet.replacement);
  };

  const handleUpdate = () => {
    if (!newTrigger.trim() || !newReplacement.trim()) {
      toast({
        title: "Invalid input",
        description: "Both trigger and replacement text are required",
        variant: "destructive",
      });
      return;
    }

    const updated = snippets.map((s) =>
      s.id === editingId
        ? { ...s, trigger: newTrigger.trim(), replacement: newReplacement.trim() }
        : s
    );
    saveSnippets(updated);
    setEditingId(null);
    setNewTrigger("");
    setNewReplacement("");

    toast({
      title: "Snippet updated",
      description: "Your changes have been saved",
    });
  };

  const handleDelete = (id: string) => {
    const updated = snippets.filter((s) => s.id !== id);
    saveSnippets(updated);

    toast({
      title: "Snippet deleted",
      description: "The snippet has been removed",
    });
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setNewTrigger("");
    setNewReplacement("");
  };

  return (
    <Card className={`${className} bg-gray-900 border-gray-700`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">Voice Snippets</CardTitle>
          <Button
            size="sm"
            onClick={() => setIsAdding(true)}
            disabled={isAdding || editingId !== null}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Add new snippet form */}
        {isAdding && (
          <div className="mb-4 p-3 bg-gray-800 rounded-lg border border-gray-600">
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">
                  Trigger phrase (what you say)
                </label>
                <Input
                  placeholder="e.g., sign off"
                  value={newTrigger}
                  onChange={(e) => setNewTrigger(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">
                  Replacement text (what gets typed)
                </label>
                <Textarea
                  placeholder="e.g., Best regards,&#10;Ayush Negi"
                  value={newReplacement}
                  onChange={(e) => setNewReplacement(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 min-h-[80px]"
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

        {/* Snippets list */}
        {snippets.length === 0 && !isAdding ? (
          <div className="text-center text-gray-400 py-8">
            No snippets yet. Add one to get started!
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {snippets.map((snippet) => (
              <div
                key={snippet.id}
                className="p-3 bg-gray-800 rounded-lg border border-gray-600"
              >
                {editingId === snippet.id ? (
                  <div className="space-y-3">
                    <Input
                      value={newTrigger}
                      onChange={(e) => setNewTrigger(e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                    <Textarea
                      value={newReplacement}
                      onChange={(e) => setNewReplacement(e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white min-h-[80px]"
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
                          "{snippet.trigger}"
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(snippet)}
                          className="text-gray-400 hover:text-white p-1"
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(snippet.id)}
                          className="text-gray-400 hover:text-red-400 p-1"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-gray-300 text-sm whitespace-pre-wrap">
                      {snippet.replacement}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Info */}
        <div className="mt-4 p-3 bg-gray-800 rounded-lg">
          <p className="text-xs text-gray-400">
            💡 Voice snippets let you say a short phrase that expands to longer text.
            For example, saying "sign off" could insert your full email signature.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
