import { useCallback, useEffect, useMemo, useState } from 'react'
import AdminLayout, { AdminIcon } from '../../components/AdminLayout'
import { apiRequest } from '../../services/api'
import './AdminMessagesPage.css'

type Status = 'MOI' | 'DANG_XU_LY' | 'DA_XU_LY'
type Message = { id:string;fullName:string;email:string;phone?:string;subject?:string;content:string;status:Status;adminNote?:string;handledBy?:string;createdAt:string }
type Result = { items:Message[];pagination:{total:number} }
const meta:Record<Status,{label:string;tone:string}>={MOI:{label:'Tin mới',tone:'new'},DANG_XU_LY:{label:'Đang xử lý',tone:'processing'},DA_XU_LY:{label:'Đã xử lý',tone:'done'}}
const formatDate=(value:string)=>new Intl.DateTimeFormat('vi-VN',{dateStyle:'short',timeStyle:'short'}).format(new Date(value))

function AdminMessagesPage(){
  const [messages,setMessages]=useState<Message[]>([])
  const [selected,setSelected]=useState<Message|null>(null)
  const [filter,setFilter]=useState<'ALL'|Status>('ALL')
  const [search,setSearch]=useState('')
  const [note,setNote]=useState('')
  const [loading,setLoading]=useState(true)
  const [saving,setSaving]=useState(false)
  const [error,setError]=useState('')
  const load=useCallback(async()=>{try{const data=await apiRequest<Result>('/admin/contacts?limit=100');setMessages(data.items);setError('')}catch(e){setError(e instanceof Error?e.message:'Không thể tải tin nhắn')}finally{setLoading(false)}},[])
  useEffect(()=>{load();const timer=window.setInterval(load,30000);return()=>window.clearInterval(timer)},[load])
  const filtered=useMemo(()=>{const key=search.trim().toLocaleLowerCase('vi');return messages.filter(m=>(filter==='ALL'||m.status===filter)&&(!key||[m.fullName,m.email,m.phone??'',m.content].some(v=>v.toLocaleLowerCase('vi').includes(key))))},[filter,messages,search])
  const update=async(message:Message,status:Status,close=true)=>{setSaving(true);try{await apiRequest(`/admin/contacts/${message.id}`,{method:'PATCH',body:JSON.stringify({status,adminNote:note})});const next={...message,status,adminNote:note};setMessages(items=>items.map(item=>item.id===message.id?next:item));setSelected(next);window.dispatchEvent(new Event('admin-contacts-updated'));if(close)setSelected(null)}catch(e){setError(e instanceof Error?e.message:'Không thể cập nhật')}finally{setSaving(false)}}
  const open=(message:Message)=>{setSelected(message);setNote(message.adminNote??'');if(message.status==='MOI'){setNote(message.adminNote??'');void update(message,'DANG_XU_LY',false)}}
  const count=(status?:Status)=>status?messages.filter(m=>m.status===status).length:messages.length
  return <AdminLayout activeItem="messages" searchValue={search} onSearchChange={setSearch} searchPlaceholder="Tìm tên, email, số điện thoại...">
    <div className="admin-messages-heading"><div><span>CHĂM SÓC KHÁCH HÀNG</span><h1>Tin nhắn liên hệ</h1><p>Tiếp nhận và theo dõi yêu cầu hỗ trợ từ khách hàng.</p></div><button onClick={load}>↻ Làm mới</button></div>
    <div className="admin-message-stats">{([['ALL','Tất cả',count()],['MOI','Tin mới',count('MOI')],['DANG_XU_LY','Đang xử lý',count('DANG_XU_LY')],['DA_XU_LY','Đã xử lý',count('DA_XU_LY')]] as const).map(item=><button key={item[0]} className={filter===item[0]?'is-active':''} onClick={()=>setFilter(item[0])}><span>{item[1]}</span><strong>{item[2]}</strong></button>)}</div>
    <section className="admin-message-list">{error&&<div className="admin-message-error">{error}</div>}{loading?<div className="admin-message-empty">Đang tải...</div>:filtered.length===0?<div className="admin-message-empty"><AdminIcon name="message"/><strong>Chưa có tin nhắn</strong></div>:filtered.map(m=><button className={`admin-message-row${m.status==='MOI'?' is-unread':''}`} key={m.id} onClick={()=>open(m)}><span className="admin-message-avatar">{m.fullName.charAt(0).toLocaleUpperCase('vi')}</span><span className="admin-message-copy"><span><strong>{m.fullName}</strong><small>{m.email}{m.phone?` • ${m.phone}`:''}</small></span><b>{m.subject||'Yêu cầu hỗ trợ'}</b><p>{m.content}</p></span><span className="admin-message-meta"><time>{formatDate(m.createdAt)}</time><i className={`is-${meta[m.status].tone}`}>{meta[m.status].label}</i></span></button>)}</section>
    {selected&&<div className="admin-message-modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&setSelected(null)}><section className="admin-message-modal"><header><div><span>CHI TIẾT LIÊN HỆ</span><h2>{selected.fullName}</h2></div><button onClick={()=>setSelected(null)}><AdminIcon name="close"/></button></header><div className="admin-message-modal-body"><div className="admin-message-info"><a href={`mailto:${selected.email}`}>{selected.email}</a>{selected.phone&&<a href={`tel:${selected.phone}`}>{selected.phone}</a>}<time>{formatDate(selected.createdAt)}</time></div><div className="admin-message-content"><strong>{selected.subject||'Yêu cầu hỗ trợ'}</strong><p>{selected.content}</p></div><label>Ghi chú của admin<textarea rows={4} value={note} onChange={e=>setNote(e.target.value)} placeholder="Nội dung đã tư vấn, lịch gọi lại..."/></label></div><footer><button onClick={()=>setSelected(null)}>Đóng</button><button className="is-processing" disabled={saving} onClick={()=>update(selected,'DANG_XU_LY')}>Đang xử lý</button><button className="is-complete" disabled={saving} onClick={()=>update(selected,'DA_XU_LY')}>{saving?'Đang lưu...':'Đã xử lý'}</button></footer></section></div>}
  </AdminLayout>
}
export default AdminMessagesPage
