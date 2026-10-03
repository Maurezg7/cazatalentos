// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

interface ICazatalentos {
    struct Artist {
        address owner;
        uint32 supporterCount;
        string metadataURI;
        bool exists;
    }

    struct Supporter {
        uint32 rank;
        uint8 weight;
        uint64 signedAt;
        uint256 stake;
    }

    event ArtistRegistered(uint256 indexed artistId, address indexed owner, string uri);
    event BeliefSigned(
        uint256 indexed artistId, address indexed supporter, uint32 rank, uint8 weight
    );

    /// @notice Artist id does not exist.
    error ArtistDoesNotExist(uint256 artistId);
    /// @notice Metadata URI must be non-empty.
    error EmptyMetadataURI();
    /// @notice The artist owner cannot sign belief for their own artist.
    error ArtistOwnerCannotSign(uint256 artistId, address owner);
    /// @notice Supporter has already signed for this artist.
    error AlreadySigned(uint256 artistId, address supporter);
    /// @notice msg.value is below the minimum stake.
    error InsufficientStake(uint256 provided, uint256 required);
    /// @notice A constructor or function parameter is invalid.
    error InvalidParameter(string name);

    /// @notice Registers a new artist with the given metadata URI.
    /// @param metadataURI Off-chain metadata URI (non-empty).
    /// @return artistId Newly assigned artist id (starts at 1).
    function registerArtist(string calldata metadataURI) external returns (uint256 artistId);

    /// @notice Signs belief in an artist by staking native currency.
    /// @param artistId Existing artist id.
    function signBelief(uint256 artistId) external payable;

    /// @notice Returns artist data for an existing artist.
    /// @param artistId Artist id to look up.
    /// @return Artist struct.
    function artistOf(uint256 artistId) external view returns (Artist memory);

    /// @notice Returns supporter data; zero-struct if never signed.
    /// @param artistId Artist id.
    /// @param supporter Supporter address.
    /// @return Supporter struct.
    function supporterOf(uint256 artistId, address supporter)
        external
        view
        returns (Supporter memory);

    /// @notice Returns the fixed weight for a given rank.
    /// @param rank Rank starting at 1.
    /// @return weight Weight for that rank band.
    function weightForRank(uint32 rank) external pure returns (uint8 weight);

    /// @notice Total number of registered artists.
    /// @return Count of artists.
    function totalArtists() external view returns (uint256);
}
