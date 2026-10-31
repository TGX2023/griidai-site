import React, {useEffect,useRef} from 'react';
import {useEditor, useEditorState, EditorContent} from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {useField} from '@strapi/strapi/admin';
import './editor.css';
const empty={type:'doc',content:[{type:'paragraph'}]};
const allowedLink=value=>{try{const u=new URL(value,'https://griidai.com');return ['https:','http:','mailto:'].includes(u.protocol)&&!/^\/(industries|workflows)(?:\/|\.html|$)/i.test(u.pathname)&&!u.username&&!u.password;}catch{return false;}};
export default function LimitedRichText({name,label,hint,required,disabled}) {
 const {value,onChange,error}=useField(name);
 const lastEmitted=useRef(JSON.stringify(value||empty));
 const editor=useEditor({extensions:[StarterKit.configure({heading:false,bulletList:false,orderedList:false,listItem:false,listKeymap:false,blockquote:false,code:false,codeBlock:false,horizontalRule:false,strike:false,underline:false,trailingNode:false,link:{openOnClick:false,autolink:false,isAllowedUri:allowedLink}})],content:value||empty,editable:!disabled,onUpdate:({editor})=>{const json=editor.getJSON();lastEmitted.current=JSON.stringify(json);onChange(name,json);},editorProps:{attributes:{id:`griidai-${name}`,'aria-label':label||name,'aria-required':String(!!required)}}});
 useEffect(()=>{const incoming=JSON.stringify(value||empty);if(editor&&incoming!==lastEmitted.current){lastEmitted.current=incoming;editor.commands.setContent(value||empty,{emitUpdate:false});}},[value,editor]);
 useEffect(()=>{editor?.setEditable(!disabled);},[disabled,editor]);
 const format=useEditorState({editor,selector:({editor})=>({bold:editor?.isActive('bold')||false,italic:editor?.isActive('italic')||false,link:editor?.isActive('link')||false})});
 const btn=(title,action,active=false)=><button type="button" title={title} aria-label={title} aria-pressed={active} disabled={disabled||!editor} onMouseDown={e=>e.preventDefault()} onClick={action}>{title}</button>;
 return <div className="griidai-field"><label>{label}{required?' *':''}</label><div className="griidai-toolbar">{btn('Bold',()=>editor.chain().focus().toggleBold().run(),format?.bold)}{btn('Italic',()=>editor.chain().focus().toggleItalic().run(),format?.italic)}{btn('Link',()=>{const href=window.prompt('Link URL (https://…)',editor.getAttributes('link').href||'');if(href===null)return;if(!href)editor.chain().focus().unsetLink().run();else if(allowedLink(href))editor.chain().focus().setLink({href}).run();else window.alert('Use a valid link. Industries and Workflows links are unavailable.');},format?.link)}{btn('Remove link',()=>editor.chain().focus().unsetLink().run())}{btn('Undo',()=>editor.chain().focus().undo().run())}{btn('Redo',()=>editor.chain().focus().redo().run())}</div><EditorContent editor={editor}/><small>{hint||'Enter: new paragraph. Shift+Enter: new line. Pasted fonts, colors and sizes are removed.'}</small>{error&&<p role="alert">{error}</p>}</div>;
}
