/* Public configuration (safe to publish: OAuth client IDs and Drive file IDs are not secrets).
   WEB_CLIENT_ID: the "Web application" OAuth client ID from Google Cloud (Authorized JavaScript origin https://blur7285.github.io,
   Authorized redirect URI https://blur7285.github.io/wedding-planner/). Until it is set, each device can paste it in the Sign-in panel.
   SYNC_FOLDER_ID / SYNC_FILE_ID: the shared "Wedding Planner Sync" folder and its data file; access is granted only by sharing it in Drive. */
window.WP_CONFIG = {
  WEB_CLIENT_ID: '',
  SYNC_FOLDER_ID: '1IgPWFlCCccFFK82Q9z_ru2IUD_pe6rtn',
  SYNC_FILE_ID: '172BSAeagqLHFjhumKZTOKtoLfrYwCZLk'
};
