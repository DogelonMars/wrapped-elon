# WrappedElon

Contract to wrap Elon with lower-precision for bridging to Solana

Specifications:
* Truncates native ethereum mainnet ELON tokens from 18 decimals to 4 decimals
* Allows owner (DAO or admin wallet) to emergency disable wrapping and unwrapping
* Future contracts based on this codebase can enable wrapping of other native tokens that are normally un-bridgable to Solana

WrappedElon is intended to be implemented as part of the Dogelon Mars Stargate bridging platform.

https://dogelonmars.com/
