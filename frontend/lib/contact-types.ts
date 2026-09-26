export type ContactMessage = {
 id:string; name:string; email:string; subject:string; message:string;
 createdAt:string; updatedAt:string; status:'new'|'in_progress'|'resolved'; notes:string;
 notification:{status:'pending'|'not_configured'|'accepted'|'failed';recipient:string;providerId?:string;attemptedAt?:string;error?:string}
}
