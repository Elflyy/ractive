import Hook from '../../events/Hook';
import runloop from '../../global/runloop';
import { splitKeypath } from '../../shared/keypaths';

const updateHook = new Hook( 'update' );

export default function Ractive$update ( keypath ) {
	if ( keypath ) keypath = splitKeypath( keypath );

	const model = keypath ?
		this.viewmodel.joinAll( keypath ) :
		this.viewmodel;

	if ( model.parent && model.parent.wrapper ) return this.update( model.parent.getKeypath( this ) );

	const promise = runloop.start( this, true );

	model.mark();
	model.registerChange( model.getKeypath(), model.get() );

	if ( keypath ) {
		// there may be unresolved refs that are now resolvable up the context tree
		let parent = model.parent;
		while ( keypath.length && parent ) {
			if ( parent.clearUnresolveds ) parent.clearUnresolveds( keypath.pop() );
			parent = parent.parent;
		}
	}

	// notify upstream of changes
	model.notifyUpstream();

	runloop.end();

	updateHook.fire( this, model );

	return promise;
}
