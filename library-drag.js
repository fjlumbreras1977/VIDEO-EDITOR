const types={filter:'application/x-droma-filter',transition:'application/x-droma-transition',asset:'application/x-droma-asset'};

/** Keep library drags separate from native image URLs and external file imports. */
export function createLibraryDrag(){
 let current=null;
 return {
  start(event){
   const card=event.target.closest?.('[data-filter],[data-transition],[data-asset]');
   const kind=Object.keys(types).find(key=>card?.dataset[key]!==undefined);
   if(!kind||!event.dataTransfer)return false;
   current={kind,id:card.dataset[kind]};
   const transfer=event.dataTransfer;
   transfer.clearData();
   transfer.setData(types[kind],current.id);
   transfer.setData('text/plain',`droma:${kind}:${current.id}`);
   transfer.effectAllowed='copy';
   transfer.setDragImage?.(card,20,20);
   event.stopPropagation();
   return true;
  },
  read(event){
   if(current)return {...current};
   const transfer=event.dataTransfer;
   if(!transfer)return null;
   const available=Array.from(transfer.types||[]);
   for(const [kind,type] of Object.entries(types)){
    if(available.includes(type))return {kind,id:transfer.getData(type)};
   }
   const match=/^droma:(filter|transition|asset):(.+)$/.exec(transfer.getData('text/plain'));
   return match?{kind:match[1],id:match[2]}:null;
  },
  clear(){current=null;}
 };
}
