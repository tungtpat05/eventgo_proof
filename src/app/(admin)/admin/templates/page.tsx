'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import {
  getChecklistTemplatesAction,
  deleteChecklistTemplateAction,
} from '@/features/admin/actions/admin-actions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import {
  Plus,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Layers,
} from 'lucide-react';

export default function AdminTemplatesPage() {
  const t = useTranslations('admin.templates');
  const locale = useLocale();

  const [templates, setTemplates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const loadData = async () => {
    try {
      const data = await getChecklistTemplatesAction();
      setTemplates(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = (id: string, name: string) => {
    if (!confirm(t('deleteConfirm', { name }))) return;
    startTransition(async () => {
      try {
        await deleteChecklistTemplateAction(id);
        await loadData();
      } catch (err: any) {
        alert(err.message || 'Error deleting template');
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Action bar */}
      <div className="flex items-center justify-end">
        <Link href="/admin/templates/new">
          <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white text-xs gap-1.5 shadow-xs h-8 px-3">
            <Plus className="h-3.5 w-3.5" />
            {t('createNew')}
          </Button>
        </Link>
      </div>

      {/* Templates List */}
      {isLoading ? (
        <div className="py-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      ) : templates.length === 0 ? (
        <div className="py-12 text-center bg-white rounded-xl border border-slate-200 p-8 space-y-3">
          <Layers className="h-12 w-12 text-slate-300 mx-auto" />
          <p className="text-base font-semibold text-slate-700">{t('emptyTitle')}</p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {t('emptyDesc')}
          </p>
          <Link href="/admin/templates/new">
            <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white text-xs gap-1 mt-2">
              <Plus className="h-4 w-4" /> {t('createFirst')}
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {templates.map((tpl) => (
            <div
              key={tpl.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:border-purple-300 transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs mb-1.5 font-mono">
                      {tpl.code}
                    </Badge>
                    <h3 className="text-lg font-bold text-slate-900">{tpl.name}</h3>
                  </div>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(tpl.id, tpl.name)}
                    disabled={isPending}
                    className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 -mr-2 -mt-2 h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {tpl.description && (
                  <p className="text-xs text-slate-500 mt-1">{tpl.description}</p>
                )}

                {/* Checklist Items Preview */}
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                  <p className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                    <span>{t('criteriaHeader')}</span>
                    <span className="text-slate-400 font-normal">{t('criteriaUnit', { count: tpl.items.length })}</span>
                  </p>

                  <ul className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {tpl.items.map((item: any) => (
                      <li key={item.id} className="text-xs text-slate-600 flex items-center justify-between bg-slate-50 p-2 rounded-lg">
                        <span className="flex items-center gap-1.5 font-medium truncate max-w-[200px] sm:max-w-[260px]">
                          <CheckCircle2 className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                          {item.title}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-[10px] text-slate-500 font-mono">[{item.category}]</span>
                          {item.is_required && (
                            <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                              {t('required')}
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs text-slate-400 border-t border-slate-100">
                <span>{t('statusLabel')} <strong className="text-emerald-600">{t('statusActive')}</strong></span>
                <span>{t('createdAtLabel', { date: formatDate(tpl.created_at, locale) })}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
