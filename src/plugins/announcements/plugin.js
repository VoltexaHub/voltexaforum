export default {
  slots: {},  // announcements doesn't need slots — it has its own admin page and global banner
  categoryTypes: {},
  adminPages: [
    {
      label: 'Announcements',
      slug: 'announcements',
      route: '/admin/plugins/announcements',
    }
  ]
}
