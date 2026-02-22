import { Controller, Get, Post, Put, Patch, Delete, Param, Query, Body } from '@nestjs/common';
import { AdminService } from './admin.service';
import { Roles, CurrentUser, RequirePermissions } from '../common/auth/decorators';

@Controller('v1/admin')
@Roles('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  // ── Stats ──
  @Get('stats')
  stats() { return this.adminService.stats(); }

  // ── Merchants ──
  @Get('merchants')
  @RequirePermissions('merchants.view')
  listMerchants() { return this.adminService.listMerchants(); }

  @Get('merchants/:id')
  @RequirePermissions('merchants.view')
  getMerchant(@Param('id') id: string) { return this.adminService.getMerchant(id); }

  @Patch('merchants/:id')
  @RequirePermissions('merchants.manage')
  toggleMerchant(@Param('id') id: string, @Body() body: any) { return this.adminService.toggleMerchant(id, body); }

  // ── Chains ──
  @Get('chains')
  @RequirePermissions('chains.view')
  listChains() { return this.adminService.listChains(); }

  @Put('chains/:chain')
  @RequirePermissions('chains.edit')
  updateChain(@Param('chain') chain: string, @Body() body: any) { return this.adminService.updateChain(chain, body); }

  // ── Assets ──
  @Get('assets')
  @RequirePermissions('chains.view')
  listAssets() { return this.adminService.listAssets(); }

  @Patch('assets/:chain/:symbol')
  @RequirePermissions('chains.edit')
  toggleAsset(@Param('chain') chain: string, @Param('symbol') symbol: string, @Body() body: any) {
    return this.adminService.toggleAsset(chain, symbol, body);
  }

  // ── Fees ──
  @Get('fees')
  @RequirePermissions('fees.view')
  getFees() { return this.adminService.getFeeConfig(); }

  @Put('fees')
  @RequirePermissions('fees.edit')
  updateFees(@Body() body: any) { return this.adminService.updateFeeConfig(body); }

  @Get('fees/overrides')
  @RequirePermissions('fees.view')
  listFeeOverrides() { return this.adminService.listFeeOverrides(); }

  @Post('fees/overrides')
  @RequirePermissions('fees.edit')
  setFeeOverride(@Body() body: any) { return this.adminService.setFeeOverride(body); }

  @Delete('fees/overrides/:merchantId')
  @RequirePermissions('fees.edit')
  removeFeeOverride(@Param('merchantId') merchantId: string) { return this.adminService.removeFeeOverride(merchantId); }

  // ── Revenue ──
  @Get('revenue')
  @RequirePermissions('revenue.view')
  revenue() { return this.adminService.revenueStats(); }

  @Get('revenue/top-merchants')
  @RequirePermissions('revenue.view')
  topMerchants() { return this.adminService.topMerchants(); }

  // ── Health ──
  @Get('health')
  @RequirePermissions('monitoring.view')
  health() { return this.adminService.health(); }

  // ── Audit Log ──
  @Get('audit-log')
  @RequirePermissions('audit.view')
  auditLog(@Query() query: any) { return this.adminService.auditLog(query); }

  // ── Wallets ──
  @Get('wallets/stats')
  @RequirePermissions('wallets.view')
  walletStats() { return this.adminService.walletStats(); }

  @Post('wallets')
  @RequirePermissions('wallets.view')
  addWallet(@Body() body: any) { return this.adminService.addWallet(body); }

  @Put('wallets/:id')
  @RequirePermissions('wallets.view')
  updateWallet(@Param('id') id: string, @Body() body: any) { return this.adminService.updateWallet(id, body); }

  @Delete('wallets/:id')
  @RequirePermissions('wallets.view')
  removeWallet(@Param('id') id: string) { return this.adminService.removeWallet(id); }

  @Get('wallets/transactions')
  @RequirePermissions('wallets.view')
  walletTransactions(@Query() query: any) { return this.adminService.walletTransactions(query); }

  // ── Roles ──
  @Get('roles')
  @RequirePermissions('roles.view')
  listRoles() { return this.adminService.listRoles(); }

  @Post('roles')
  @RequirePermissions('roles.manage')
  createRole(@Body() body: any) { return this.adminService.createRole(body); }

  @Put('roles/:id')
  @RequirePermissions('roles.manage')
  updateRole(@Param('id') id: string, @Body() body: any) { return this.adminService.updateRole(id, body); }

  @Delete('roles/:id')
  @RequirePermissions('roles.manage')
  deleteRole(@Param('id') id: string) { return this.adminService.deleteRole(id); }

  @Get('roles/assignments')
  @RequirePermissions('roles.view')
  roleAssignments() { return this.adminService.roleAssignments(); }

  @Post('roles/assign')
  @RequirePermissions('roles.manage')
  assignRole(@Body() body: any) { return this.adminService.assignRole(body); }

  @Delete('roles/assignments/:adminUserId')
  @RequirePermissions('roles.manage')
  revokeRole(@Param('adminUserId') adminUserId: string) { return this.adminService.revokeRole(adminUserId); }

  @Get('roles/invites')
  @RequirePermissions('roles.view')
  listInvites() { return this.adminService.listInvites(); }

  @Post('roles/invites')
  @RequirePermissions('roles.manage')
  sendInvite(@Body() body: any) { return this.adminService.sendInvite(body); }

  @Delete('roles/invites/:id')
  @RequirePermissions('roles.manage')
  revokeInvite(@Param('id') id: string) { return this.adminService.revokeInvite(id); }

  // ── CMS ──
  @Get('cms/stats')
  @RequirePermissions('cms.view')
  cmsStats() { return this.adminService.cmsStats(); }

  @Get('cms/pages')
  @RequirePermissions('cms.view')
  cmsPages() { return this.adminService.cmsPages(); }

  @Put('cms/pages/:id')
  @RequirePermissions('cms.edit')
  updateCmsPage(@Param('id') id: string, @Body() body: any) { return this.adminService.updateCmsPage(id, body); }

  @Get('cms/announcements')
  @RequirePermissions('cms.view')
  cmsAnnouncements() { return this.adminService.cmsAnnouncements(); }

  @Post('cms/announcements')
  @RequirePermissions('cms.edit')
  createAnnouncement(@Body() body: any) { return this.adminService.createAnnouncement(body); }

  @Put('cms/announcements/:id')
  @RequirePermissions('cms.edit')
  updateAnnouncement(@Param('id') id: string, @Body() body: any) { return this.adminService.updateAnnouncement(id, body); }

  @Delete('cms/announcements/:id')
  @RequirePermissions('cms.edit')
  deleteAnnouncement(@Param('id') id: string) { return this.adminService.deleteAnnouncement(id); }

  @Get('cms/blog')
  @RequirePermissions('cms.view')
  cmsBlog() { return this.adminService.cmsBlog(); }

  @Post('cms/blog')
  @RequirePermissions('cms.edit')
  createBlogPost(@Body() body: any) { return this.adminService.createBlogPost(body); }

  @Put('cms/blog/:id')
  @RequirePermissions('cms.edit')
  updateBlogPost(@Param('id') id: string, @Body() body: any) { return this.adminService.updateBlogPost(id, body); }

  @Delete('cms/blog/:id')
  @RequirePermissions('cms.edit')
  deleteBlogPost(@Param('id') id: string) { return this.adminService.deleteBlogPost(id); }

  @Get('cms/faq')
  @RequirePermissions('cms.view')
  cmsFaq() { return this.adminService.cmsFaq(); }

  @Post('cms/faq')
  @RequirePermissions('cms.edit')
  createFaqEntry(@Body() body: any) { return this.adminService.createFaqEntry(body); }

  @Put('cms/faq/:id')
  @RequirePermissions('cms.edit')
  updateFaqEntry(@Param('id') id: string, @Body() body: any) { return this.adminService.updateFaqEntry(id, body); }

  @Delete('cms/faq/:id')
  @RequirePermissions('cms.edit')
  deleteFaqEntry(@Param('id') id: string) { return this.adminService.deleteFaqEntry(id); }

  @Get('cms/settings')
  @RequirePermissions('cms.view')
  cmsSettings() { return this.adminService.cmsSettings(); }

  @Put('cms/settings')
  @RequirePermissions('cms.edit')
  updateCmsSettings(@Body() body: any) { return this.adminService.updateCmsSettings(body); }

  @Get('cms/contacts')
  @RequirePermissions('cms.view')
  cmsContacts() { return this.adminService.cmsContacts(); }

  @Put('cms/contacts/:id')
  @RequirePermissions('cms.edit')
  updateContact(@Param('id') id: string, @Body() body: any) { return this.adminService.updateContact(id, body); }

  @Delete('cms/contacts/:id')
  @RequirePermissions('cms.edit')
  deleteContact(@Param('id') id: string) { return this.adminService.deleteContact(id); }

  // ── Security ──
  @Get('security/settings')
  getSecuritySettings(@CurrentUser() user: any) { return this.adminService.getSecuritySettings(user.sub); }

  @Post('security/2fa/setup')
  setup2fa(@CurrentUser() user: any) { return this.adminService.setup2fa(user.sub); }

  @Post('security/2fa/enable')
  enable2fa(@CurrentUser() user: any, @Body() body: { totp_code: string }) { return this.adminService.enable2fa(user.sub, body.totp_code); }

  @Post('security/2fa/disable')
  disable2fa(@CurrentUser() user: any, @Body() body: { totp_code: string }) { return this.adminService.disable2fa(user.sub, body.totp_code); }

  @Put('security/email-verification')
  toggleEmailVerification(@CurrentUser() user: any, @Body() body: { enabled: boolean }) {
    return this.adminService.toggleEmailVerification(user.sub, body.enabled);
  }

  @Post('security/backup-codes')
  regenerateBackupCodes(@CurrentUser() user: any) { return this.adminService.regenerateBackupCodes(user.sub); }

  @Delete('security/sessions/:id')
  revokeSession(@Param('id') id: string) { return this.adminService.revokeSession(id); }

  @Delete('security/sessions')
  revokeAllSessions(@CurrentUser() user: any) { return this.adminService.revokeAllSessions(user.sub); }

  @Put('security/password')
  changePassword(@CurrentUser() user: any, @Body() body: any) { return this.adminService.changePassword(user.sub, body); }

  // ── Exports ──
  @Post('exports')
  createExport(@CurrentUser() user: any, @Body() body: any) { return this.adminService.createExport(user.sub, body); }

  @Get('exports')
  listExports(@CurrentUser() user: any, @Query() query: any) { return this.adminService.listExports(user.sub, query); }

  @Get('exports/:id')
  getExport(@CurrentUser() user: any, @Param('id') id: string) { return this.adminService.getExport(user.sub, id); }
}
