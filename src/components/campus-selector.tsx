"use client";

import { useState, useEffect } from "react";
import { Building2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/contexts/ThemeContext";

interface Campus {
  id: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  status: string;
}

interface CampusSelectorProps {
  value?: string;
  onChange?: (campusId: string) => void;
  showAll?: boolean;
  className?: string;
}

export function CampusSelector({
  value = "all",
  onChange,
  showAll = true,
  className,
}: CampusSelectorProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampus, setSelectedCampus] = useState<string>(value);

  useEffect(() => {
    async function fetchCampuses() {
      try {
        const response = await fetch("/api/campus");
        const data = await response.json();
        if (data.campuses) {
          setCampuses(data.campuses);
        }
      } catch (error) {
        console.error("获取校区列表失败:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchCampuses();
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("selectedCampus");
    if (saved && (saved === "all" || campuses.some((c) => c.id === saved))) {
      setSelectedCampus(saved);
      onChange?.(saved);
    }
  }, [campuses, onChange]);

  const handleSelect = (campusId: string) => {
    setSelectedCampus(campusId);
    localStorage.setItem("selectedCampus", campusId);
    onChange?.(campusId);
  };

  const getCampusName = () => {
    if (selectedCampus === "all") {
      return "全部校区";
    }
    const campus = campuses.find((c) => c.id === selectedCampus);
    return campus?.name || "选择校区";
  };

  if (loading) {
    return (
      <Button variant="outline" size="sm" disabled className={`${className} ${isDark ? 'bg-white/5 border-white/10 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
        <Building2 className="w-4 h-4 mr-2" />
        加载中...
      </Button>
    );
  }

  if (campuses.length <= 1) {
    return (
      <Button variant="outline" size="sm" className={`${className} ${isDark ? 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'}`}>
        <Building2 className="w-4 h-4 mr-2" />
        {campuses.length === 0 ? "请先创建校区" : campuses[0].name}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={`${className} ${isDark ? 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'}`}>
          <Building2 className="w-4 h-4 mr-2" />
          {getCampusName()}
          <ChevronDown className="w-4 h-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className={`w-56 ${isDark ? 'bg-[#1a1f2e] border-white/10' : 'bg-white border-gray-200'}`}>
        <DropdownMenuLabel className={isDark ? 'text-gray-400' : 'text-gray-500'}>选择校区</DropdownMenuLabel>
        <DropdownMenuSeparator className={isDark ? 'bg-white/10' : 'bg-gray-100'} />
        
        {showAll && (
          <DropdownMenuItem
            onClick={() => handleSelect("all")}
            className={`${isDark ? 'text-gray-300 focus:bg-white/5 focus:text-white' : 'text-gray-700 focus:bg-gray-100'} ${selectedCampus === "all" ? (isDark ? 'bg-white/5' : 'bg-gray-50') : ''}`}
          >
            <div className="flex items-center justify-between w-full">
              <span>全部校区</span>
              {selectedCampus === "all" && (
                <Badge className={`${isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700'} border-0`}>当前</Badge>
              )}
            </div>
          </DropdownMenuItem>
        )}
        
        {showAll && campuses.length > 0 && <DropdownMenuSeparator className={isDark ? 'bg-white/10' : 'bg-gray-100'} />}
        
        {campuses.map((campus) => (
          <DropdownMenuItem
            key={campus.id}
            onClick={() => handleSelect(campus.id)}
            className={`${isDark ? 'text-gray-300 focus:bg-white/5 focus:text-white' : 'text-gray-700 focus:bg-gray-100'} ${selectedCampus === campus.id ? (isDark ? 'bg-white/5' : 'bg-gray-50') : ''}`}
          >
            <div className="flex flex-col gap-1 w-full">
              <div className="flex items-center justify-between">
                <span>{campus.name}</span>
                {selectedCampus === campus.id && (
                  <Badge className={`${isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700'} border-0`}>当前</Badge>
                )}
              </div>
              {campus.address && (
                <span className="text-xs text-gray-500">
                  {campus.address}
                </span>
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
