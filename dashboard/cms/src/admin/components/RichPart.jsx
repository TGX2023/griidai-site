import React,{useEffect,useRef,useState} from 'react';
import {useEditor,useEditorState,EditorContent} from '@tiptap/react';
import {Mark,Extension} from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import {TableKit} from '@tiptap/extension-table';
import {TaskList,TaskItem} from '@tiptap/extension-list';
import Highlight from '@tiptap/extension-highlight';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import {useTheme} from 'styled-components';
import './content-parts.css';

const BRAND='#287b8d';
const empty=()=>({type:'doc',content:[{type:'paragraph'}]});
const validSize=value=>/^\d+(?:px)?$/.test(String(value))&&parseInt(value)>=12&&parseInt(value)<=64?parseInt(value):null;
const allowedLink=value=>{
 if(typeof value!=='string'||/[\x00-\x20\\]/.test(value))return false;
 try{const u=new URL(value,'https://griidai.com');return ['http:','https:','mailto:'].includes(u.protocol)&&!u.username&&!u.password&&!/^\/(industries|workflows)(?:\/|\.html|$)/i.test(decodeURIComponent(u.pathname));}catch{return false;}
};
const PartStyle=Mark.create({
 name:'partStyle',
 addAttributes(){return {fontSize:{default:null,parseHTML:el=>validSize(el.style.fontSize),renderHTML:()=>({})},brand:{default:false,parseHTML:el=>[BRAND,'rgb(40, 123, 141)'].includes(el.style.color),renderHTML:()=>({})}};},
 parseHTML(){return [{tag:'span[style]'}];},
 renderHTML({mark}){const styles=[];if(validSize(mark.attrs.fontSize))styles.push(`font-size:${validSize(mark.attrs.fontSize)}px`);if(mark.attrs.brand)styles.push(`color:${BRAND}`);return ['span',{...(styles.length?{style:styles.join(';')}:{})},0];}
});
const Alignment=Extension.create({name:'partAlignment',addGlobalAttributes(){return [{types:['paragraph','heading'],attributes:{textAlign:{default:'left',parseHTML:el=>['left','center','right','justify'].includes(el.style.textAlign)?el.style.textAlign:'left',renderHTML:attrs=>({style:`text-align:${attrs.textAlign}`})}}}];}});

export function RichPart({part,onChange,disabled,index,mode='body',ariaLabel}){
 const theme=useTheme();
 const isTitle=mode==='title',editorLabel=ariaLabel||`Part ${index+1}`;
 const emitted=useRef(JSON.stringify(part.content||empty())),dialog=useRef(null),urlInput=useRef(null),linkTrigger=useRef(null),host=useRef(null);
 const [link,setLink]=useState(null),[linkError,setLinkError]=useState('');
 const editor=useEditor({
  extensions:[StarterKit.configure({heading:isTitle?false:{levels:[2,3,4,5,6]},bulletList:isTitle?false:{},orderedList:isTitle?false:{},listItem:isTitle?false:{},listKeymap:isTitle?false:{},blockquote:isTitle?false:{},horizontalRule:isTitle?false:{},code:false,codeBlock:false,trailingNode:false,link:isTitle?false:{openOnClick:false,autolink:false,isAllowedUri:allowedLink}}),PartStyle,Alignment,...(isTitle?[]:[TableKit.configure({table:{resizable:false}}),TaskList,TaskItem.configure({nested:true})]),Highlight.configure({multicolor:false,HTMLAttributes:{class:'griidai-brand-highlight'}}),Subscript,Superscript],
  content:part.content||empty(),editable:!disabled,
  onUpdate:({editor})=>{const content=editor.getJSON();emitted.current=JSON.stringify(content);onChange({content});},
  editorProps:{attributes:{'aria-label':ariaLabel||`Part ${index+1} content`,role:'textbox','aria-multiline':'true'}}
 });
 useEffect(()=>{const key=JSON.stringify(part.content||empty());if(editor&&key!==emitted.current){emitted.current=key;editor.commands.setContent(part.content||empty(),{emitUpdate:false});}},[part.content,editor]);
 useEffect(()=>{editor?.setEditable(!disabled);},[editor,disabled]);
 useEffect(()=>{if(link&&!dialog.current?.open){dialog.current?.showModal();urlInput.current?.focus();}else if(!link&&dialog.current?.open){dialog.current.close();linkTrigger.current?.focus();}},[link]);
 const state=useEditorState({editor,selector:({editor:e})=>e?{
  bold:e.isActive('bold'),italic:e.isActive('italic'),underline:e.isActive('underline'),strike:e.isActive('strike'),bullet:e.isActive('bulletList'),ordered:e.isActive('orderedList'),quote:e.isActive('blockquote'),task:e.isActive('taskList'),table:e.isActive('table'),highlight:e.isActive('highlight'),sub:e.isActive('subscript'),sup:e.isActive('superscript'),link:e.isActive('link'),brand:e.getAttributes('partStyle').brand||false,size:e.getAttributes('partStyle').fontSize||'',level:[2,3,4,5,6].find(level=>e.isActive('heading',{level}))||'paragraph',align:e.getAttributes(e.isActive('heading')?'heading':'paragraph').textAlign||'left',words:e.getText().trim().split(/\s+/).filter(Boolean).length,characters:e.getText().length,canUndo:e.can().undo(),canRedo:e.can().redo()
 }:null});
 const labels={'Bold':<b>B</b>,'Italic':<i>I</i>,'Underline':<u>U</u>,'Strikethrough':<s>S</s>,'GriidAi green':<span className="griidai-green-tool">A</span>,'Superscript':<>x<sup>2</sup></>,'Subscript':<>x<sub>2</sub></>,'Bullet list':'• List','Numbered list':'1. List','Quote':'“ Quote'};
 const button=(label,action,active,unavailable=false)=><button key={label} type="button" title={label} aria-label={label} aria-pressed={Boolean(active)} disabled={disabled||!editor||unavailable} onMouseDown={e=>e.preventDefault()} onClick={action}>{labels[label]||label}</button>;
 const openLink=()=>{
  if(editor.isActive('link'))editor.commands.extendMarkRange('link');
  const {from,to}=editor.state.selection;
  setLinkError('');setLink({from,to,url:editor.getAttributes('link').href||'',text:editor.state.doc.textBetween(from,to,' ')});
 };
 const saveLink=e=>{
  e.preventDefault();e.stopPropagation();if(disabled||!editor)return;
  const href=link.url.trim(),text=link.text.trim();
  if(!text||!allowedLink(href)||!href){setLinkError('Add link text and a valid URL. Industries and Workflows links are unavailable.');return;}
  const chain=editor.chain().focus().setTextSelection({from:link.from,to:link.to});
  if(text===editor.state.doc.textBetween(link.from,link.to,' '))chain.setLink({href}).run();
  else chain.insertContent({type:'text',text,marks:[{type:'link',attrs:{href}}]}).run();
  setLink(null);
 };
 const listType=state?.task?'taskItem':'listItem';
 return <div className="griidai-part-rich" ref={host}>
  <div className="griidai-part-toolbar" role="toolbar" aria-label={`${editorLabel} formatting`}>
   {!isTitle&&<label>Text style<select aria-label={`${editorLabel} text style`} disabled={disabled||!editor} value={state?.level||'paragraph'} onChange={e=>{const v=e.target.value;v==='paragraph'?editor.chain().focus().setParagraph().run():editor.chain().focus().setHeading({level:Number(v)}).run();}}><option value="paragraph">Paragraph</option>{[2,3,4,5,6].map(level=><option key={level} value={level}>Heading {level}</option>)}</select></label>}
   <label>Font size<select aria-label={`${editorLabel} font size`} disabled={disabled||!editor} value={state?.size||''} onChange={e=>editor.chain().focus().setMark('partStyle',{fontSize:e.target.value?Number(e.target.value):null}).run()}><option value="">Default</option>{[12,14,16,18,20,24,28,32,40,48,56,64].map(size=><option key={size} value={size}>{size} px</option>)}</select></label>
   {button('Bold',()=>editor.chain().focus().toggleBold().run(),state?.bold)}
   {button('Italic',()=>editor.chain().focus().toggleItalic().run(),state?.italic)}
   {button('Underline',()=>editor.chain().focus().toggleUnderline().run(),state?.underline)}
   {button('Strikethrough',()=>editor.chain().focus().toggleStrike().run(),state?.strike)}
   {button('GriidAi green',()=>editor.chain().focus().setMark('partStyle',{brand:!state?.brand}).run(),state?.brand)}
   {button('Highlight',()=>editor.chain().focus().toggleHighlight().run(),state?.highlight)}
   {button('Subscript',()=>editor.chain().focus().unsetSuperscript().toggleSubscript().run(),state?.sub)}
   {button('Superscript',()=>editor.chain().focus().unsetSubscript().toggleSuperscript().run(),state?.sup)}
   {!isTitle&&<>{button('Bullet list',()=>editor.chain().focus().toggleBulletList().run(),state?.bullet)}
   {button('Numbered list',()=>editor.chain().focus().toggleOrderedList().run(),state?.ordered)}
   {button('Checklist',()=>editor.chain().focus().toggleTaskList().run(),state?.task)}
   {button('Indent list',()=>editor.chain().focus().sinkListItem(listType).run(),false,!editor?.can().sinkListItem(listType))}
   {button('Outdent list',()=>editor.chain().focus().liftListItem(listType).run(),false,!editor?.can().liftListItem(listType))}
   {button('Quote',()=>editor.chain().focus().toggleBlockquote().run(),state?.quote)}</>}
   <label>Alignment<select aria-label={`${editorLabel} alignment`} disabled={disabled||!editor} value={state?.align||'left'} onChange={e=>{const chain=editor.chain().focus().updateAttributes('paragraph',{textAlign:e.target.value});if(!isTitle)chain.updateAttributes('heading',{textAlign:e.target.value});chain.run();}}>{['left','center','right','justify'].map(a=><option key={a}>{a}</option>)}</select></label>
   {!isTitle&&<><button type="button" ref={linkTrigger} title="Link" aria-label="Link" aria-pressed={Boolean(state?.link)} disabled={disabled||!editor} onMouseDown={e=>e.preventDefault()} onClick={openLink}>Link</button>
   {button('Remove link',()=>editor.chain().focus().unsetLink().run(),false,!state?.link)}
   {button('Horizontal rule',()=>editor.chain().focus().setHorizontalRule().run())}
   {button('Insert table',()=>editor.chain().focus().insertTable({rows:3,cols:3,withHeaderRow:true}).run())}</>}
   {button('Clear formatting',()=>editor.chain().focus().unsetAllMarks().clearNodes().run())}
   {button('Undo',()=>editor.chain().focus().undo().run(),false,!state?.canUndo)}
   {button('Redo',()=>editor.chain().focus().redo().run(),false,!state?.canRedo)}
  </div>
  {state?.table&&<div className="griidai-table-toolbar" role="toolbar" aria-label="Table editing">
   {button('Add row',()=>editor.chain().focus().addRowAfter().run())}{button('Delete row',()=>editor.chain().focus().deleteRow().run())}
   {button('Add column',()=>editor.chain().focus().addColumnAfter().run())}{button('Delete column',()=>editor.chain().focus().deleteColumn().run())}
   {button('Merge cells',()=>editor.chain().focus().mergeCells().run(),false,!editor?.can().mergeCells())}{button('Split cell',()=>editor.chain().focus().splitCell().run(),false,!editor?.can().splitCell())}
   {button('Header row',()=>editor.chain().focus().toggleHeaderRow().run())}{button('Delete table',()=>editor.chain().focus().deleteTable().run())}
  </div>}
  <EditorContent editor={editor}/>
  <div className="griidai-editor-count">{state?.words||0} words · {state?.characters||0} characters</div>
  <dialog ref={dialog} className="griidai-link-dialog" style={{background:theme.colors.neutral0,color:theme.colors.neutral800}} aria-label="Add or edit link" onCancel={e=>{e.preventDefault();setLink(null);}}>
   {link&&<div className="griidai-link-fields" onKeyDown={e=>{if(e.key==='Enter')saveLink(e);}}><strong>Add or edit link</strong><label>Link text<input type="text" aria-label="Link text" maxLength={2000} value={link.text} onChange={e=>setLink({...link,text:e.target.value})}/></label><label>Link URL<input ref={urlInput} type="text" inputMode="url" aria-label="Link URL" maxLength={2000} value={link.url} onChange={e=>setLink({...link,url:e.target.value})} placeholder="https://… or /page/"/></label>{linkError&&<p role="alert">{linkError}</p>}<div><button type="button" onClick={()=>setLink(null)}>Cancel</button><button type="button" disabled={disabled} onClick={saveLink}>Apply link</button></div></div>}
  </dialog>
 </div>;
}
