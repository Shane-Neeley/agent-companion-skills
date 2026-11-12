// Generated from the reviewed shared product operation contract.
const entries=[
  [
    "capabilities",
    {
      "name": "get_capabilities",
      "scope": "boom.workspace.read",
      "http": {
        "method": "GET",
        "path": "/api/v1/capabilities"
      }
    }
  ],
  [
    "context",
    {
      "name": "get_workspace_context",
      "scope": "boom.workspace.read",
      "http": {
        "method": "GET",
        "path": "/api/v1/workspace/context"
      }
    }
  ],
  [
    "propose",
    {
      "name": "propose_draft",
      "scope": "boom.drafts.write",
      "http": {
        "method": "POST",
        "path": "/api/v1/draft-proposals"
      }
    }
  ],
  [
    "writerContext",
    {
      "name": "get_writer_context",
      "scope": "boom.writer.read",
      "http": {
        "method": "GET",
        "path": "/api/v1/writer/context"
      }
    }
  ],
  [
    "submitCandidates",
    {
      "name": "submit_candidates",
      "scope": "boom.writer.write",
      "http": {
        "method": "POST",
        "path": "/api/v1/writer/candidates"
      }
    }
  ],
  [
    "uploadMedia",
    {
      "name": "upload_media",
      "scope": "boom.writer.write",
      "http": {
        "method": "POST",
        "path": "/api/v1/writer/media"
      }
    }
  ],
  [
    "listSources",
    {
      "name": "list_sources",
      "scope": "boom.workspace.read",
      "http": {
        "method": "GET",
        "path": "/api/v1/sources"
      }
    }
  ],
  [
    "getSource",
    {
      "name": "get_source",
      "scope": "boom.workspace.read",
      "http": {
        "method": "GET",
        "path": "/api/v1/sources/get"
      }
    }
  ],
  [
    "upsertSource",
    {
      "name": "upsert_source",
      "scope": "boom.workspace.write",
      "http": {
        "method": "POST",
        "path": "/api/v1/sources/save"
      }
    }
  ],
  [
    "deleteSource",
    {
      "name": "delete_source",
      "scope": "boom.workspace.write",
      "http": {
        "method": "POST",
        "path": "/api/v1/sources/delete"
      }
    }
  ],
  [
    "listDrafts",
    {
      "name": "list_drafts",
      "scope": "boom.drafts.read",
      "http": {
        "method": "GET",
        "path": "/api/v1/drafts"
      }
    }
  ],
  [
    "getDraft",
    {
      "name": "get_draft",
      "scope": "boom.drafts.read",
      "http": {
        "method": "GET",
        "path": "/api/v1/drafts/get"
      }
    }
  ],
  [
    "editDraft",
    {
      "name": "edit_draft",
      "scope": "boom.drafts.manage",
      "http": {
        "method": "POST",
        "path": "/api/v1/drafts/edit"
      }
    }
  ],
  [
    "cancelDraft",
    {
      "name": "cancel_draft",
      "scope": "boom.drafts.manage",
      "http": {
        "method": "POST",
        "path": "/api/v1/drafts/cancel"
      }
    }
  ],
  [
    "recordManualOutcome",
    {
      "name": "record_manual_outcome",
      "scope": "boom.review.write",
      "http": {
        "method": "POST",
        "path": "/api/v1/drafts/outcome"
      }
    }
  ],
  [
    "getPreferences",
    {
      "name": "get_preferences",
      "scope": "boom.settings.read",
      "http": {
        "method": "GET",
        "path": "/api/v1/preferences"
      }
    }
  ],
  [
    "updatePreferences",
    {
      "name": "update_preferences",
      "scope": "boom.settings.write",
      "http": {
        "method": "POST",
        "path": "/api/v1/preferences/update"
      }
    }
  ],
  [
    "getFeedback",
    {
      "name": "get_feedback",
      "scope": "boom.review.read",
      "http": {
        "method": "GET",
        "path": "/api/v1/feedback"
      }
    }
  ],
  [
    "recordFeedback",
    {
      "name": "record_feedback",
      "scope": "boom.review.write",
      "http": {
        "method": "POST",
        "path": "/api/v1/feedback/record"
      }
    }
  ],
  [
    "exportWorkspace",
    {
      "name": "export_workspace",
      "scope": "boom.workspace.export",
      "http": {
        "method": "GET",
        "path": "/api/v1/workspace/export"
      }
    }
  ],
  [
    "importWorkspace",
    {
      "name": "import_workspace",
      "scope": "boom.workspace.write",
      "http": {
        "method": "POST",
        "path": "/api/v1/workspace/import"
      }
    }
  ],
  [
    "clearWorkspace",
    {
      "name": "clear_workspace",
      "scope": "boom.workspace.write",
      "http": {
        "method": "POST",
        "path": "/api/v1/workspace/clear"
      }
    }
  ],
  [
    "listCandidates",
    {
      "name": "list_candidates",
      "scope": "boom.writer.read",
      "http": {
        "method": "GET",
        "path": "/api/v1/writer/feed"
      }
    }
  ],
  [
    "getCandidate",
    {
      "name": "get_candidate",
      "scope": "boom.writer.read",
      "http": {
        "method": "GET",
        "path": "/api/v1/writer/candidates/get"
      }
    }
  ],
  [
    "editCandidate",
    {
      "name": "edit_candidate",
      "scope": "boom.writer.manage",
      "http": {
        "method": "POST",
        "path": "/api/v1/writer/candidates/edit"
      }
    }
  ],
  [
    "retireCandidate",
    {
      "name": "retire_candidate",
      "scope": "boom.writer.manage",
      "http": {
        "method": "POST",
        "path": "/api/v1/writer/candidates/retire"
      }
    }
  ],
  [
    "recordCandidateFeedback",
    {
      "name": "record_candidate_feedback",
      "scope": "boom.review.write",
      "http": {
        "method": "POST",
        "path": "/api/v1/writer/feedback"
      }
    }
  ],
  [
    "getWriterSettings",
    {
      "name": "get_writer_settings",
      "scope": "boom.writer.read",
      "http": {
        "method": "GET",
        "path": "/api/v1/writer/settings"
      }
    }
  ],
  [
    "updateWriterSettings",
    {
      "name": "update_writer_settings",
      "scope": "boom.settings.write",
      "http": {
        "method": "POST",
        "path": "/api/v1/writer/settings/update"
      }
    }
  ],
  [
    "listAuthoredPosts",
    {
      "name": "list_authored_posts",
      "scope": "boom.writer.read",
      "http": {
        "method": "GET",
        "path": "/api/v1/writer/authored"
      }
    }
  ],
  [
    "recordAuthoredPost",
    {
      "name": "record_authored_post",
      "scope": "boom.writer.manage",
      "http": {
        "method": "POST",
        "path": "/api/v1/writer/authored/record"
      }
    }
  ],
  [
    "setAuthoredLearning",
    {
      "name": "set_authored_learning",
      "scope": "boom.settings.write",
      "http": {
        "method": "POST",
        "path": "/api/v1/writer/authored/learning"
      }
    }
  ],
  [
    "getLearning",
    {
      "name": "get_learning",
      "scope": "boom.writer.read",
      "http": {
        "method": "GET",
        "path": "/api/v1/writer/learning"
      }
    }
  ],
  [
    "exportWriterData",
    {
      "name": "export_writer_data",
      "scope": "boom.workspace.export",
      "http": {
        "method": "GET",
        "path": "/api/v1/writer/export"
      }
    }
  ],
  [
    "downloadMedia",
    {
      "name": "download_media",
      "scope": "boom.writer.read",
      "http": {
        "method": "GET",
        "path": "/api/v1/writer/media/download"
      }
    }
  ],
  [
    "getAccountStatus",
    {
      "name": "get_account_status",
      "scope": "boom.account.read",
      "http": {
        "method": "GET",
        "path": "/api/v1/account/status"
      }
    }
  ],
  [
    "getAccountLinks",
    {
      "name": "get_account_links",
      "scope": "boom.account.read",
      "http": {
        "method": "GET",
        "path": "/api/v1/account/links"
      }
    }
  ],
  [
    "listAgentConnections",
    {
      "name": "list_agent_connections",
      "scope": "boom.account.read",
      "http": {
        "method": "GET",
        "path": "/api/v1/account/agents"
      }
    }
  ],
  [
    "revokeAgentConnection",
    {
      "name": "revoke_agent_connection",
      "scope": "boom.account.write",
      "http": {
        "method": "POST",
        "path": "/api/v1/account/agents/revoke"
      }
    }
  ],
  [
    "requestXConnection",
    {
      "name": "request_x_connection",
      "scope": "boom.account.write",
      "http": {
        "method": "POST",
        "path": "/api/v1/account/x/connect"
      }
    }
  ],
  [
    "disconnectX",
    {
      "name": "disconnect_x",
      "scope": "boom.account.write",
      "http": {
        "method": "POST",
        "path": "/api/v1/account/x/disconnect"
      }
    }
  ],
  [
    "loadFollowing",
    {
      "name": "load_following",
      "scope": "boom.provider.use",
      "http": {
        "method": "POST",
        "path": "/api/v1/account/x/following"
      }
    }
  ],
  [
    "getDraftingStatus",
    {
      "name": "get_drafting_status",
      "scope": "boom.account.read",
      "http": {
        "method": "GET",
        "path": "/api/v1/account/drafting"
      }
    }
  ],
  [
    "requestHostedDraft",
    {
      "name": "request_hosted_draft",
      "scope": "boom.provider.use",
      "http": {
        "method": "POST",
        "path": "/api/v1/account/drafting/request"
      }
    }
  ],
  [
    "getPublicationStatus",
    {
      "name": "get_publication_status",
      "scope": "boom.account.read",
      "http": {
        "method": "GET",
        "path": "/api/v1/account/publication"
      }
    }
  ],
  [
    "getSuggestedFeed",
    {
      "name": "get_suggested_feed",
      "scope": "boom.workspace.read",
      "http": {
        "method": "GET",
        "path": "/api/v1/feed/suggested"
      }
    }
  ],
  [
    "getRequestStatus",
    {
      "name": "get_request_status",
      "scope": "boom.workspace.read",
      "http": {
        "method": "GET",
        "path": "/api/v1/requests/status"
      }
    }
  ]
];
export const BOOM_OPERATIONS=Object.freeze(Object.fromEntries(entries.map(([method,operation])=>[method,Object.freeze(operation)])));
export const BOOM_OPERATION_SCOPES=Object.freeze(Object.fromEntries(entries.map(([,operation])=>[operation.name,operation.scope])));
export const BOOM_COMMANDS=Object.freeze(Object.fromEntries(entries.map(([method])=>[method.replace(/[A-Z]/g,letter=>'-'+letter.toLowerCase()),method])));
