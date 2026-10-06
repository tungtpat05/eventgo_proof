'use server';

import { createServerSupabaseClient, createAdminSupabaseClient } from '@/infrastructure/supabase/server';
import { requireCampaignManager } from '@/application/authorization/campaign-access';
import { revalidatePath } from 'next/cache';
import { duplicateBoothUseCase, batchApplyChecklistUseCase, cascadeLocationSupervisorUseCase } from '@/application/use-cases/booths/wizard-booth-operations';
import { assignBoothPersonnelUseCase } from '@/application/use-cases/booths/manage-booth';
import { CHECKLIST_TEMPLATE_PRESETS } from '@/domain/constants/checklist-templates';
import { ChecklistCategory, CampaignStatus, CampaignRole, CampaignMemberStatus } from '@/domain/enums';
import { validateCampaignActivationUseCase } from '@/application/use-cases/campaigns/validate-campaign-activation';

export interface WizardActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// 1. Tạo chiến dịch nháp ban đầu từ Step 1
export async function createDraftCampaignAction(formData: FormData): Promise<WizardActionResult<{ id: string }>> {
  const title = (formData.get('title') as string)?.trim();
  const companyName = (formData.get('companyName') as string)?.trim() || 'Chưa đặt tên công ty';
  const brandName = (formData.get('brandName') as string)?.trim() || 'Chưa đặt nhãn hàng';
  const companyTaxCode = (formData.get('companyTaxCode') as string)?.trim() || null;
  const companyContactName = (formData.get('companyContactName') as string)?.trim() || null;
  const companyContactEmail = (formData.get('companyContactEmail') as string)?.trim() || null;
  const companyContactPhone = (formData.get('companyContactPhone') as string)?.trim() || null;
  const companyAddress = (formData.get('companyAddress') as string)?.trim() || null;
  const startDate = (formData.get('startDate') as string) || new Date().toISOString().split('T')[0];
  const endDate = (formData.get('endDate') as string) || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
  const description = (formData.get('description') as string)?.trim() || null;

  if (!title) {
    return { success: false, error: 'Tên chiến dịch không được để trống.' };
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return { success: false, error: 'Yêu cầu đăng nhập.' };

    const { data: campaignId, error } = await supabase.rpc('create_campaign_with_manager', {
      p_title: title,
      p_brand_name: brandName,
      p_description: description || '',
      p_company_name: companyName,
      p_company_tax_code: companyTaxCode || '',
      p_company_address: companyAddress || '',
      p_company_contact_name: companyContactName || '',
      p_company_contact_email: companyContactEmail || '',
      p_company_contact_phone: companyContactPhone || '',
      p_start_date: startDate,
      p_end_date: endDate,
      p_status: CampaignStatus.DRAFT,
    });

    if (error || !campaignId) {
      return { success: false, error: error?.message || 'Lỗi khi khởi tạo chiến dịch.' };
    }

    revalidatePath('/campaigns');
    return { success: true, data: { id: campaignId } };
  } catch (err: any) {
    return { success: false, error: err.message || 'Lỗi hệ thống.' };
  }
}

// 2. Cập nhật thông tin Step 1
export async function saveCampaignStep1Action(
  campaignId: string,
  formData: FormData
): Promise<WizardActionResult> {
  try {
    await requireCampaignManager(campaignId);
    const supabase = await createServerSupabaseClient();

    const title = (formData.get('title') as string)?.trim();
    const companyName = (formData.get('companyName') as string)?.trim();
    const brandName = (formData.get('brandName') as string)?.trim();
    const companyTaxCode = (formData.get('companyTaxCode') as string)?.trim() || null;
    const companyContactName = (formData.get('companyContactName') as string)?.trim() || null;
    const companyContactEmail = (formData.get('companyContactEmail') as string)?.trim() || null;
    const companyContactPhone = (formData.get('companyContactPhone') as string)?.trim() || null;
    const companyAddress = (formData.get('companyAddress') as string)?.trim() || null;
    const startDate = (formData.get('startDate') as string);
    const endDate = (formData.get('endDate') as string);
    const description = (formData.get('description') as string)?.trim() || null;

    if (!title) {
      return { success: false, error: 'Tên chiến dịch không được để trống.' };
    }

    const updatePayload: any = {
      title,
      company_name: companyName,
      brand_name: brandName,
      company_tax_code: companyTaxCode,
      company_contact_name: companyContactName,
      company_contact_email: companyContactEmail,
      company_contact_phone: companyContactPhone,
      company_address: companyAddress,
      description,
      updated_at: new Date().toISOString(),
    };

    if (startDate) updatePayload.start_date = startDate;
    if (endDate) updatePayload.end_date = endDate;

    const { error } = await supabase
      .from('campaigns')
      .update(updatePayload)
      .eq('id', campaignId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath(`/campaigns/${campaignId}/wizard`);
    revalidatePath('/campaigns');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// 3. Thêm địa điểm nhanh
export async function addLocationInWizardAction(
  campaignId: string,
  formData: FormData
): Promise<WizardActionResult<{ id: string }>> {
  try {
    await requireCampaignManager(campaignId);
    const supabase = createAdminSupabaseClient();

    const name = (formData.get('name') as string)?.trim();
    const address = (formData.get('address') as string)?.trim() || 'Chưa cập nhật địa chỉ';
    const city = (formData.get('city') as string)?.trim() || 'Hà Nội';

    if (!name) {
      return { success: false, error: 'Tên địa điểm không được để trống.' };
    }

    const { data, error } = await supabase
      .from('locations')
      .insert({
        campaign_id: campaignId,
        name,
        address,
        city,
      })
      .select('id')
      .single();

    if (error || !data) {
      return { success: false, error: error?.message || 'Lỗi khi thêm địa điểm.' };
    }

    revalidatePath(`/campaigns/${campaignId}/wizard`);
    return { success: true, data: { id: data.id } };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// 4. Xóa địa điểm
export async function deleteLocationInWizardAction(
  campaignId: string,
  locationId: string
): Promise<WizardActionResult> {
  try {
    await requireCampaignManager(campaignId);
    const supabase = createAdminSupabaseClient();

    const { error } = await supabase
      .from('locations')
      .delete()
      .eq('id', locationId)
      .eq('campaign_id', campaignId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath(`/campaigns/${campaignId}/wizard`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// 5. Thêm Booth mới
export async function createBoothInWizardAction(
  campaignId: string,
  locationId: string,
  formData: FormData
): Promise<WizardActionResult<{ id: string }>> {
  try {
    await requireCampaignManager(campaignId);
    const supabase = createAdminSupabaseClient();

    const name = (formData.get('name') as string)?.trim();
    const code = (formData.get('code') as string)?.trim() || null;
    const description = (formData.get('description') as string)?.trim() || null;

    if (!name) {
      return { success: false, error: 'Tên booth không được để trống.' };
    }

    const { data, error } = await supabase
      .from('booths')
      .insert({
        location_id: locationId,
        name,
        code,
        description,
      })
      .select('id')
      .single();

    if (error || !data) {
      return { success: false, error: error?.message || 'Lỗi khi tạo booth.' };
    }

    revalidatePath(`/campaigns/${campaignId}/wizard`);
    return { success: true, data: { id: data.id } };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// 6. Cập nhật Booth
export async function updateBoothInWizardAction(
  campaignId: string,
  boothId: string,
  formData: FormData
): Promise<WizardActionResult> {
  try {
    await requireCampaignManager(campaignId);
    const supabase = createAdminSupabaseClient();

    const name = (formData.get('name') as string)?.trim();
    const code = (formData.get('code') as string)?.trim() || null;
    const description = (formData.get('description') as string)?.trim() || null;

    if (!name) {
      return { success: false, error: 'Tên booth không được để trống.' };
    }

    const { error } = await supabase
      .from('booths')
      .update({
        name,
        code,
        description,
        updated_at: new Date().toISOString(),
      })
      .eq('id', boothId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath(`/campaigns/${campaignId}/wizard`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// 7. Xóa Booth
export async function deleteBoothInWizardAction(
  campaignId: string,
  boothId: string
): Promise<WizardActionResult> {
  try {
    await requireCampaignManager(campaignId);
    const supabase = createAdminSupabaseClient();

    const { error } = await supabase.from('booths').delete().eq('id', boothId);
    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath(`/campaigns/${campaignId}/wizard`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// 8. Nhân bản Booth (Duplicate Booth)
export async function duplicateBoothInWizardAction(
  campaignId: string,
  sourceBoothId: string,
  targetLocationId?: string,
  newName?: string,
  newCode?: string | null
): Promise<WizardActionResult<{ id: string }>> {
  try {
    await requireCampaignManager(campaignId);
    const newBoothId = await duplicateBoothUseCase({
      sourceBoothId,
      targetLocationId,
      newName,
      newCode,
    });

    revalidatePath(`/campaigns/${campaignId}/wizard`);
    return { success: true, data: { id: newBoothId } };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// 9. Thêm Tiêu chí Checklist
export async function addChecklistItemInWizardAction(
  campaignId: string,
  boothId: string,
  formData: FormData
): Promise<WizardActionResult> {
  try {
    await requireCampaignManager(campaignId);
    const supabase = await createServerSupabaseClient();

    const title = (formData.get('title') as string)?.trim();
    const description = (formData.get('description') as string)?.trim() || null;
    const category = (formData.get('category') as ChecklistCategory) || ChecklistCategory.OTHER;
    const isRequired = formData.get('isRequired') !== 'false';

    if (!title) {
      return { success: false, error: 'Tiêu chí kiểm tra không được để trống.' };
    }

    // Get current max order index
    const { data: existing } = await supabase
      .from('checklist_items')
      .select('order_index')
      .eq('booth_id', boothId)
      .order('order_index', { ascending: false })
      .limit(1);

    const nextOrder = existing && existing.length > 0 ? existing[0].order_index + 1 : 1;

    const { error } = await supabase.from('checklist_items').insert({
      booth_id: boothId,
      title,
      description,
      category,
      is_required: isRequired,
      order_index: nextOrder,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath(`/campaigns/${campaignId}/wizard`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// 10. Xóa Tiêu chí Checklist
export async function deleteChecklistItemInWizardAction(
  campaignId: string,
  itemId: string
): Promise<WizardActionResult> {
  try {
    await requireCampaignManager(campaignId);
    const supabase = await createServerSupabaseClient();

    const { error } = await supabase.from('checklist_items').delete().eq('id', itemId);
    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath(`/campaigns/${campaignId}/wizard`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// 11. Áp dụng Checklist hàng loạt hoặc từ Mẫu Template
export async function batchApplyChecklistInWizardAction(
  campaignId: string,
  params: {
    sourceBoothId?: string;
    templateCode?: string;
    targetBoothIds: string[];
    mode?: 'REPLACE' | 'APPEND';
  }
): Promise<WizardActionResult> {
  try {
    await requireCampaignManager(campaignId);

    let templateItems: any[] | undefined = undefined;

    if (params.templateCode) {
      const preset = CHECKLIST_TEMPLATE_PRESETS.find((t) => t.code === params.templateCode);
      if (preset) {
        templateItems = preset.items;
      }
    }

    await batchApplyChecklistUseCase({
      campaignId,
      sourceBoothId: params.sourceBoothId,
      templateItems,
      targetBoothIds: params.targetBoothIds,
      mode: params.mode || 'REPLACE',
    });

    revalidatePath(`/campaigns/${campaignId}/wizard`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// 12. Phân công Supervisor & Approver cho từng Booth
export async function assignBoothPersonnelInWizardAction(
  campaignId: string,
  boothId: string,
  supervisorMemberId: string | null,
  approverMemberId: string | null
): Promise<WizardActionResult> {
  try {
    await requireCampaignManager(campaignId);
    await assignBoothPersonnelUseCase({
      boothId,
      supervisorMemberId,
      approverMemberId,
    });

    revalidatePath(`/campaigns/${campaignId}/wizard`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// 13. Kế thừa Supervisor cấp địa điểm
export async function cascadeLocationSupervisorInWizardAction(
  campaignId: string,
  locationId: string,
  supervisorMemberId: string | null,
  applyToAllBooths: boolean = true
): Promise<WizardActionResult> {
  try {
    await requireCampaignManager(campaignId);
    await cascadeLocationSupervisorUseCase({
      campaignId,
      locationId,
      supervisorMemberId,
      applyToAllBooths,
    });

    revalidatePath(`/campaigns/${campaignId}/wizard`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// 14. Kích hoạt chiến dịch (Step 5)
export async function activateCampaignInWizardAction(campaignId: string): Promise<WizardActionResult> {
  try {
    await requireCampaignManager(campaignId);
    const readiness = await validateCampaignActivationUseCase(campaignId);

    if (!readiness.canActivate) {
      return {
        success: false,
        error: `Chưa đủ điều kiện kích hoạt:\n- ${readiness.errors.join('\n- ')}`,
      };
    }

    const supabase = await createServerSupabaseClient();
    const { error } = await supabase
      .from('campaigns')
      .update({
        status: CampaignStatus.ACTIVE,
        updated_at: new Date().toISOString(),
      })
      .eq('id', campaignId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/campaigns');
    revalidatePath(`/campaigns/${campaignId}`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// 15. Cập nhật wizard_step đang thao tác để phục hồi khi quay lại
export async function updateWizardStepAction(
  campaignId: string,
  step: number
): Promise<WizardActionResult> {
  try {
    await requireCampaignManager(campaignId);
    const supabase = await createServerSupabaseClient();
    try {
      await (supabase.from('campaigns').update as any)({
        wizard_step: step,
        updated_at: new Date().toISOString(),
      }).eq('id', campaignId);
    } catch {
      // Safe fallback if column wizard_step not yet applied in remote db
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

