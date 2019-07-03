import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ApiService from '~/utils/apiService';
import LazyLoad from 'react-lazyload';
import Loader from '~/components/loader';
import RestaurantListItem from '~/components/restaurantListItem';
import EndOfListLabel from '~/components/endOfListLabel';
import { useAppContext } from '~/modules/app/contextProvider';
import useScrolledToEndListener from '~/modules/home/useScrolledToEndListener';
import './styles.scss';

const RestaurantList = ({ filters }) => {
  const [startFromOffset, setStartFromOffset] = useState(0);
  const [restaurantList, setRestaurantList] = useState([]);
  const [isRequestInProgress, setIsRequestInProgress] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [appContextValue, dispatch] = useAppContext();
  const { userLocation: { latitude, longitude } = {} } = appContextValue;
  
  const scrollEndCallback = useCallback(() => {
    (!isRequestInProgress && hasMoreData) && setStartFromOffset(startFromOffset + 20);
  }, [startFromOffset, isRequestInProgress, hasMoreData]);
  
  useEffect(() => {
    if (latitude && longitude) {
      setRestaurantList([]);
      setHasMoreData(true);
      setStartFromOffset(0);
    }
  }, [latitude, longitude]);
  
  const params = useMemo(() => ({
    ...filters,
    ...latitude && longitude ? {
      lat: latitude,
      lon: longitude,
      radius: 3000,
      sort: 'real_distance',
      order: 'asc',
      start: startFromOffset,
      count: 30,
    }: {},
  }), [latitude, longitude, startFromOffset, filters]);

  useEffect(() => {
    async function fetchFromAPI() {
      if (latitude && longitude) {
        setIsRequestInProgress(true);

        const apiResponseData = await ApiService.getAllRestaurants(params);
        const nextRestaurantList = apiResponseData.restaurants.map(({ restaurant }) => restaurant);

        nextRestaurantList.length ?
          setRestaurantList(restaurantList.concat(nextRestaurantList)) : setHasMoreData(false);
        setIsRequestInProgress(false);
      }
    }

    fetchFromAPI();
  }, [params]);
  
  useScrolledToEndListener(scrollEndCallback);

  if (!latitude || !longitude) {
    return (
      <EndOfListLabel label="Please choose a location to find all restaurants" />
    );
  }

  return (
    <React.Fragment>
      <div className="restaurant-list-container">
        {
          restaurantList.map(restaurant => (
            <LazyLoad key={restaurant.id} height={150} >
              <RestaurantListItem key={restaurant.id} restaurantData={restaurant} />
            </LazyLoad>
          ))
        }
      </div>
      <div>
        {
          hasMoreData ? <Loader /> : <EndOfListLabel />
        }
      </div>
    </React.Fragment>
  );
};

export default RestaurantList;
