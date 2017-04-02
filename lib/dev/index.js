import classof
	from 'classof'

import nymbol
	from 'nymbol'

import nymrod, {EXTEND, CREATE, WAS}
	from 'nymrod'

const nym = nymbol.suffix('nymdux', '')
export const SQUISH     = nym('Squish')
export const REDUCE     = nym('reduce')
export const INDUCE     = nym('induce')
export const CAPTURE    = nym('capture')
export const DISTRIBUTE = nym('distribute')
export const METHOD     = nym('method')
export const MATCH      = nym('match')
export const ROUTE      = nym('route')
export const REACTION   = nym('reaction')

const {assign, create} = Object

function transformer(f) {
	return nymrod.call(this, Constructor)[EXTEND](f)
}

const Constructor = nymrod($ => class extends $ {

	get [SQUISH]() { // Memoized, on account of /^[^a-z][A-Z]/.test(SQUISH)
		for (let k in this) if (this.hasOwnProperty(k)) {
			const t = this[k]
			switch (classof(t)) {

				case 'Object': {
					t[SQUISH]
				} break
				
				case 'Array': {
					for (let i_ = t.length, i = 0; i < i_; i++)
						if ('Object' === classof(t[i])) t[SQUISH]
				} break

			}
			if ('Object' === classof(t)) t[SQUISH]
		}
	}

	[REDUCE](action) {
		let that = this[INDUCE](action)
		if (this === that) return this
		that[SQUISH]
		return that
	}

	[INDUCE](action) {
		return this[INDUCE + METHOD](action)
	}

	[INDUCE + METHOD](action) {
		const k = INDUCE + action.type
		return 'function' === typeof(this[k]) ? this[k](action) : this
	}

	[INDUCE + CAPTURE](action) {
		const {payload} = action
		return this[REDUCE](payload)
	}

	[INDUCE + MATCH](action) {
		const {meta} = action, that = meta[MATCH]
		for (let k in that) if (this[k] !== that[k]) return this // should be deep equals?
		return this[INDUCE + CAPTURE](action)
	}

	[INDUCE + ROUTE](action) {
		const {meta} = action, path = meta[ROUTE]
		if (0 === path.length) return this[INDUCE + CAPTURE](action)
		const [head, ...tail] = path, node = this[head]
		if ('Object' !== classof(node)) return this
		const reaction = this[REACTION](action)
		reaction.meta[ROUTE] = tail
		return this[CREATE]({[head]: node[REDUCE](reaction)})
	}

	[INDUCE + DISTRIBUTE](action) {
		let that = {}
		// Distribute `action` to all children:
		for (let k in this) {
			const u = this[k]
			out: switch (classof(u)) {
				
				case 'Object': {
					if ('function' === typeof(u[REDUCE]))
						that[k] = u[REDUCE](action)
				} break

				case 'Array': {
					const {length} = u
					const v = new Array(length)
					for (let i = 0; i < length; i++) {
						v[i] = 'function' === typeof(u[i][REDUCE])
						?	u[i][REDUCE](action) 
						:	u[i]
					}
					for (let i = 0; i < length; i++) if (u[i] !== v[i]) {
						that[k] = v
						break out
					}
				} break

			}
		}

		// Values of `that` are (allegedly) non-literals, so this becomes a shallow edit:
		that = this[CREATE](that)
		return that[INDUCE + CAPTURE](action)
	}

	[INDUCE + CREATE](action) {
		return this[CREATE](action.payload)
	}

	[REACTION](action) {
		return deepClone(action)
	}

})

function deepClone(that) {
	const clone = create(that)
	DeepClone.call(clone, that)
	return clone
}

function DeepClone(that) {
	for (const k in that) if (that.hasOwnProperty(k)) {
		const v = that[k]
		this[k] = 'Object' === classof(v) ? deepClone(v) : v
	}
}

export {transformer, Constructor}
export default transformer
