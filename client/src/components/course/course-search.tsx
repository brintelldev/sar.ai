import { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  courseType: string;
  status: string;
}

interface CourseSearchProps {
  courses: Course[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onCourseSelect?: (course: Course) => void;
  placeholder?: string;
  maxSuggestions?: number;
}

export function CourseSearch({
  courses,
  searchTerm,
  onSearchChange,
  onCourseSelect,
  placeholder = "Buscar cursos...",
  maxSuggestions = 5
}: CourseSearchProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter courses based on search term
  const filteredCourses = courses.filter(course => {
    const term = searchTerm.toLowerCase();
    return (
      course.title.toLowerCase().includes(term) ||
      course.description.toLowerCase().includes(term) ||
      course.category.toLowerCase().includes(term)
    );
  }).slice(0, maxSuggestions);

  // Handle input changes
  const handleInputChange = (value: string) => {
    onSearchChange(value);
    setShowSuggestions(value.length > 0);
    setHighlightedIndex(-1);
  };

  // Handle course selection
  const handleCourseSelect = (course: Course) => {
    onSearchChange(course.title);
    setShowSuggestions(false);
    if (onCourseSelect) {
      onCourseSelect(course);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || filteredCourses.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredCourses.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredCourses.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0) {
          handleCourseSelect(filteredCourses[highlightedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  // Clear search
  const clearSearch = () => {
    onSearchChange('');
    setShowSuggestions(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format course type for display
  const formatCourseType = (type: string) => {
    switch(type?.toLowerCase()) {
      case 'online': return 'Online';
      case 'presencial': return 'Presencial';
      case 'hibrido': return 'Híbrido';
      default: return 'Online';
    }
  };

  // Format level for display
  const formatLevel = (level: string) => {
    switch(level?.toLowerCase()) {
      case 'basico': return 'Básico';
      case 'intermediario': return 'Intermediário';
      case 'avancado': return 'Avançado';
      default: return 'Básico';
    }
  };

  // Get level badge color
  const getLevelBadgeColor = (level: string) => {
    switch(level?.toLowerCase()) {
      case 'basico': return 'bg-green-100 text-green-800 border-green-200';
      case 'intermediario': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'avancado': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get type badge color
  const getTypeBadgeColor = (type: string) => {
    switch(type?.toLowerCase()) {
      case 'online': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'presencial': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'hibrido': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(searchTerm.length > 0)}
          className="pl-10 pr-10"
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100"
          >
            <X className="h-4 w-4 text-gray-400" />
          </Button>
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && filteredCourses.length > 0 && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-96 overflow-y-auto shadow-lg">
          <CardContent className="p-0">
            {filteredCourses.map((course, index) => (
              <div
                key={course.id}
                className={`p-3 cursor-pointer border-b last:border-b-0 hover:bg-gray-50 ${
                  index === highlightedIndex ? 'bg-blue-50' : ''
                }`}
                onClick={() => handleCourseSelect(course)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm text-gray-900 mb-1">
                      {course.title}
                    </h4>
                    <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                      {course.description}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline" className={`text-xs ${getLevelBadgeColor(course.level)}`}>
                        {formatLevel(course.level)}
                      </Badge>
                      <Badge variant="outline" className={`text-xs ${getTypeBadgeColor(course.courseType)}`}>
                        {formatCourseType(course.courseType)}
                      </Badge>
                      <Badge variant="outline" className="text-xs bg-gray-100 text-gray-700">
                        {course.category}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* No results message */}
      {showSuggestions && searchTerm.length > 0 && filteredCourses.length === 0 && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 shadow-lg">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-gray-600">
              Nenhum curso encontrado para "{searchTerm}"
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}